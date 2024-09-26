import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import multer from "multer";
import path from 'path';
import { fileURLToPath } from 'url';
import passport from "passport";
import session from "express-session";
import bcrypt from "bcrypt";
import { error } from "console";
import { Strategy } from "passport-local";
import env from "dotenv";

env.config;



const saltRounds = 10;



const app = express();
const port = 3000;


app.use(session({
  secret: process.env.topsecret,
    resave: false,
    saveUninitialized: true,
    cookie :{

      maxAge : 1000 * 60 * 60 * 24

    }

}));

app.use(express.static("public"));


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use('/resumes', express.static(path.join(__dirname, 'resumes')));
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

// Set the views directory
app.set('views', './views');


app.use(passport.initialize());
app.use(passport.session());

const db = new pg.Client({
    user: env.process.username,
    host: env.process.host,
    database: env.process.database,
    password: env.process.password,
    port: env.process.port
});

db.connect(); // Ensure database connection is established

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });






// async function checkuser(name, pass) {
//     try {
//         const query = "SELECT name, password FROM admin WHERE name = $1";
//         const values = [name];
//         const result = await db.query(query, values);

//         if (result.rows.length > 0) {
//             const user = result.rows[0];

//             // Compare hashed password
//             if(pass == user.password){
//                 return user;
//             }
//         }

//         console.log("No user found or password incorrect");
//         return null;
//     } catch (error) {
//         console.log("This is the error: " + error.message);
//         return null;
//     }
// }


async function selectuser() {
    try {
        const result = await db.query("SELECT * FROM admin where id = 4");

        if (result.rows.length > 0) {
            console.log("Selected user:", result.rows[0].id);
            return result.rows[0];
        } else {
            console.log("No user found select user function");
            return null;
        }
    } catch (error) {
        console.log("Error selecting user:", error.message);
        return null;
    }
};

async function registeruser(name,password,email,phone,image) {
    const selectQuery = "SELECT * FROM admin WHERE email = $1";
    const values = [email];  // Assuming `email` is the value you're looking for
try {
  const result = await db.query(selectQuery, values);
  if (result.rows.length > 0) {
    console.log("User found:", result.rows[0]);  // This will print the first matching row
    return result.rows[0];
  } else {
    console.log("No user found with the provided email.");

    const insertQuery = "INSERT INTO admin (name, password, email, phone, profile) VALUES ($1, $2, $3, $4, $5) RETURNING *";
    const values = [name, password, email, phone, image];
    
    try {
      const result = await db.query(insertQuery, values);
      console.log("Inserted row:", result.rows[0]);  // This will print the inserted row
    } catch (error) {
      console.error("Error inserting data:", error.message);
    }


  }
} catch (error) {
  console.error("Error executing query:", error.message);
}






    

}

// Route to render the registration form
app.get("/",async (req, res) => {
    // res.redirect("home.ejs");  // Render the registration page for the root URL
    const result = await db.query("select  * from admin");

    console.log(result);

    if(result.rowCount > 0 ){

      res.render("login");
    }else{

        res.render("register.ejs");


    }
  });

  app.get("/", async (req, res) => {
    try {
      const result = await db.query("SELECT * FROM admin");
  
      if (result.rowCount > 0) {
        res.render("login");  // If an admin exists, show login page
      } else {
        res.render("register.ejs");  // If no admin exists, show registration page
      }
    } catch (error) {
      console.error("Error fetching admin:", error);
      res.status(500).send("Internal server error");
    }
  });
  
  
  
  // Route to handle the form submission and file upload
//   app.post("/register", upload.single("rimage"), async (req, res) => {
//     const data = {

//          rname : req.body.rname,
//          rmail : req.body.remail,
//          rphon : req.body.rphone,
//          rpass : req.body.rpassword,
//          rimg: req.file['rimage'] ? req.file['rimage'][0].buffer : null,





//     }
//     // projecticon: req.files['projecticon'] ? req.files['projecticon'][0].buffer : null,
//     // Checking if all fields are present
//     if (!data.rname || !data.rmail || !data.rphon || !data.rpass || !data.rimg) {
//     //   const filePath = `/uploads/${rimage.filename}`;
//     //   console.log("Name:", rname);
//     //   console.log("Email:", rmail);
//     //   console.log("Phone:", rphon);
//     //   console.log("Password:", rpass);
//     //   console.log("File Path:", filePath);
//     console.log("Missing fields");
//     res.status(400).send("Please fill in all required fields.");
//       // Handle the form data, e.g., save to the database
  
//       // Redirect or render a page based on the result
//       console.log(data);
//       res.redirect("/login.ejs");
//     } else {
   
//     }
//   });



passport.use(new Strategy(async function verify(username,password,cb){

  console.log(username);
  
  try {
    // Query the database for the user with the provided email
    const result = await db.query("SELECT * FROM admin WHERE email = $1", [username]);

    if (result.rowCount === 1) {
      const user = result.rows[0];
      const hashedPassword = user.password;

      // Compare the provided password with the hashed password from the database
      bcrypt.compare(password, hashedPassword, (error, isMatch) => {
        if (error) {
          console.error("Error comparing passwords:", error);
          res.status(500).send("Internal server error");
        } else if (isMatch) {
          console.log("Login successful!");
          return cb(null, user);
          // work with call back
        } else {
          console.log("Invalid credentials. Please try again.");
          // res.status(401).send("Invalid credentials. Please try again.");
        }
      });
    } else {
      console.log("User not found");

    }
  } catch (error) {
    console.error("Error logging in:", error);
  }


}));

 


app.post("/register", upload.single("rimage"), async (req, res) => {
    const data = {
      rname: req.body.rname,
      rmail: req.body.remail,
      rphon: req.body.rphone,
      rpass: req.body.rpassword,
      rimg: req.file ? req.file.buffer : null
    };
  
    // Check if all fields are present
    if (!data.rname || !data.rmail || !data.rphon || !data.rpass || !data.rimg) {
      console.log("Missing fields");
      res.status(400).send("Please fill in all required fields.");
    } else {
      // Hash the password with bcrypt
      bcrypt.hash(data.rpass, saltRounds, async (err, hash) => {
        if (err) {
          console.error("Error while hashing password:", err);
          res.status(500).send("Server error while processing password.");
        } else {
          try {
            // Pass hashed password and other form data to your database function
            const result = await registeruser(data.rname, hash, data.rmail, data.rphon, data.rimg);
  
            if (result && result.rowCount === 1) {
              console.log("User registered successfully!");
              res.redirect("/login.ejs");
            } else {
              console.error("Error: User registration failed.");
              res.status(500).send("Error registering user.");
            }
          } catch (error) {
            console.error("Database error:", error.message);
            res.status(500).send("Database error.");
          }
        }
      });
    }
  });


  // work more with bcypt for login
  

  passport.serializeUser((user,cb) =>{

    cb(null,user);

  });


  passport.deserializeUser((user,cb) =>{

    cb(null,user);

  });



  app.post(
    "/login",
    passport.authenticate("local", {
      successRedirect: "/layout",
      failureRedirect: "/login",
    })
  );
  






 





















//its not taking the login so should work on that the page i white can' get it says












// app.get("/btnlogin", async (req, res) => {
//     const { username, password } = req.query;


//     const login = await checkuser(username, password);

//     if (login) {
//         const loginuser = await selectuser();
//         // res.render("layout", { user: loginuser });
//         res.redirect("/layout"); 

//     } else {
//         console.log("Login failed");
//         res.send("Login failed");
//     }
// });





// app.get("layout", async (req, res) => {
//     try {
//         const loginuser = await selectuser();
//         const resumes = await selectresume();

//         if (loginuser && resumes) {
//             res.render("layout", { user: loginuser, resumes: resumes });
//         } else {
//             res.send("No user found layout function");
//         }
//     } catch (error) {
//         console.log("Error:", error.message);
//         res.status(500).send("Internal Server Error");
//     }
// });

app.get("/layout", async (req, res) => {
if (req.isAuthenticated()) {
  try {
    const loginuser = await selectuser();
    const resumes = await selectresume();

    // Log the fetched data to ensure it's not null or undefined
    console.log("loginuser:", loginuser);
    console.log("resumes:", resumes);

    if (loginuser && resumes) {
        res.render("layout", { user: loginuser, resumes: resumes });
    } else {
        res.send("No user or resumes found in layout function");
    }
} catch (error) {
    console.log("Error:", error.message);
    res.status(500).send("Internal Server Error");
}
  } else {
    res.redirect("/login");
  }

});








// app.get('/images/:id', async (req, res) => {
//     const userId = req.params.id;
//     try {
//         const result = await db.query('SELECT profile FROM admin WHERE id = $1', [userId]);
//         if (result.rows.length > 0) {
//             const imageBuffer = result.rows[0].profile;
//             res.writeHead(200, {
//                 'Content-Type': 'image/jpeg', // Adjust based on the image format
//                 'Content-Length': imageBuffer.length
//             });
//             res.end(imageBuffer);
//         } else {
//             res.status(404).send('Image not found');
//         }
//     } catch (error) {
//         console.error('Error fetching image:', error.message);
//         res.status(500).send('Internal Server Error');
//     }
// });


// // work with register




// app.post("/btnaddresume", upload.single('resumefile'), async (req, res) => {
//     const title = req.body.resumetitle;
//     const desc = req.body.resumedescription;
//     const file = req.file;

//     if (title && desc && file) {
//         const filePath = `/resumes/${file.filename}`;
//         await insertResume(0, filePath, new Date(), title, desc);
//         res.redirect('/layout');
//     } else {
//         res.status(400).send("Please fill all the fields");
//     }
// });





// const insertResume = async (id, filePath, date, title, description) => {
//     const query = `
//         INSERT INTO resumes (id, resume, date, title, description)
//         VALUES ($1, $2, $3, $4, $5)
//     `;
//     const values = [id, filePath, date, title, description];

//     try {
//         await db.query(query, values);
//         console.log('Resume inserted successfully');
//     } catch (error) {
//         console.error('Error inserting resume:', error.message);
//     }
// };



const selectresume = async () => {
    try {
        const result = await db.query("SELECT * FROM resumes");
        if (result.rows.length > 0) {
            // Log each resume's details
            result.rows.forEach(resume => {
                console.log("ID:", resume.id);
                console.log("Resume:", resume.resume);
                console.log("Title:", resume.title);
            });
            return result.rows; // Return only the rows from the query
        } else {
            console.log("No resumes found.");
            return []; // Return an empty array if no resumes found
        }
    } catch (error) {
        console.log("Error is " + error.message);
        return []; // Return an empty array in case of error
    }
};



// app.get('/download/:id', async (req, res) => {
//     const resumeId = req.params.id;

//     try {
//         const result = await db.query('SELECT resume, title FROM resumes WHERE id = $1', [resumeId]);
        
//         if (result.rows.length > 0) {
//             const resume = result.rows[0].resume;
//             const title = result.rows[0].title;
//             const fileName = `${title}.pdf`;

//             // Set the headers for the response
//             res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
//             res.setHeader('Content-Type', 'application/pdf');
            
//             // Send the binary data as a response
//             res.send(resume);
//         } else {
//             res.status(404).send('Resume not found');
//         }
//     } catch (error) {
//         console.error('Error fetching resume:', error.message);
//         res.status(500).send('Server error');
//     }
// });








// app.post('/addproject', upload.fields([
//     { name: 'projectLogo', maxCount: 10 }, 
//     { name: 'projectfile', maxCount: 1 }, 
//     { name: 'projecticon', maxCount: 1 }
// ]), async (req, res) => {
//     const loginuser = await selectuser();

//     if (!loginuser) {
//         return res.status(404).send('User not found');
//     }

//     const userid = loginuser.id;
//     const data = {
//         name: req.body.projectName,
//         logos: req.files['projectLogo'] ? req.files['projectLogo'].map(file => file.buffer) : [],
//         file: req.files['projectfile'] ? req.files['projectfile'][0].buffer : null,
//         description: req.body.projectDescription,
//         language: req.body.projectLanguage,
//         loginuser: userid,
//         projecticon: req.files['projecticon'] ? req.files['projecticon'][0].buffer : null,
//     };

//     if (!data.name || !data.description || !data.language || data.logos.length === 0 || !data.file || !data.projecticon) {
//         return res.status(400).send('Please fill all the required fields.');
//     } else {
//         try {
//             await addProject(data);
//             res.redirect("/layout");
//         } catch (error) {
//             console.log('Error adding project:', error.message);
//             res.status(500).send('Internal Server Error');
//         }
//     }
// });


// async function addProject(data) {
//     const query = `
//         INSERT INTO tbl_projects (project_name, project_logo, project_file, project_description, project_language, created_at, admin_id, icon)
//         VALUES ($1, $2, $3, $4, $5, NOW(), $6, $7)
//     `;
//     const logoData = JSON.stringify(data.logos); // Store multiple logos as a JSON string
//     const values = [
//         data.name,
//         logoData,
//         data.file,
//         data.description,
//         data.language,
//         data.loginuser, // Use the actual user ID
//         data.projecticon
//     ];

//     await db.query(query, values);
//     console.log('Project added successfully');
// }






app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
