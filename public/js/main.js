

document.getElementById("profileImage").addEventListener("click", function() {
    document.getElementById("fileInput").click();
  });

  // Update the image preview when a file is selected
  document.getElementById("fileInput").addEventListener("change", function() {
    const file = this.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(e) {
        document.getElementById("profileImage").src = e.target.result;
      }
      reader.readAsDataURL(file);
    }
  });

