// Ensure getUserFromToken is globally accessible
function getUserFromToken() {
    const token = localStorage.getItem('token');
    if (!token) return null;
  
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload; // { userId, username, role, iat, exp }
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }
  
  document.addEventListener('DOMContentLoaded', function () {
    // Function to display user-specific UI elements
    function displayUserUI() {
      const user = getUserFromToken();
  
      const loginButtons = document.querySelectorAll('.login_button');
      const logoutButtons = document.querySelectorAll('.logout_button');
      const registerButtons = document.querySelectorAll('.register_button');
      const roleDisplayElements = document.querySelectorAll('.user_role');
  
      if (user) {
        // User is logged in
        loginButtons.forEach(btn => btn.style.display = 'none');
        registerButtons.forEach(btn => btn.style.display = 'none');
        logoutButtons.forEach(btn => btn.style.display = 'block');
  
        // Display the user's role and username
        roleDisplayElements.forEach(el => {
          el.textContent = `Welcome, ${user.username} (${capitalizeFirstLetter(user.role)})`;
          el.style.display = 'block';
        });
  
        // Show 'Post New Research Opportunity' menu item for professors
        if (user.role === 'professor') {
          const postOpportunityMenus = document.querySelectorAll('.post_opportunity_menu');
          postOpportunityMenus.forEach(menu => menu.style.display = 'block');
        }
  
        // Show 'My CV' menu item for students
        if (user.role === 'student') {
          const myCVMenus = document.querySelectorAll('.my_cv_menu');
          myCVMenus.forEach(menu => menu.style.display = 'block');
        }
  
      } else {
        // User is not logged in
        loginButtons.forEach(btn => btn.style.display = 'block');
        registerButtons.forEach(btn => btn.style.display = 'block');
        logoutButtons.forEach(btn => btn.style.display = 'none');
        roleDisplayElements.forEach(el => el.style.display = 'none');
  
        // Hide 'Post New Research Opportunity' menu item
        const postOpportunityMenus = document.querySelectorAll('.post_opportunity_menu');
        postOpportunityMenus.forEach(menu => menu.style.display = 'none');
  
        // Hide 'My CV' menu item
        const myCVMenus = document.querySelectorAll('.my_cv_menu');
        myCVMenus.forEach(menu => menu.style.display = 'none');
      }
    }
  
    // Helper function to capitalize the first letter
    function capitalizeFirstLetter(string) {
      return string.charAt(0).toUpperCase() + string.slice(1);
    }
  
    // Logout Function
    window.logout = function () {
      localStorage.removeItem('token');
      alert('Logged out successfully!');
      window.location.href = 'researchIndex.html';
    };
  
    displayUserUI(); // Call on page load
  });
  