// Client/myCV.js

document.addEventListener('DOMContentLoaded', function () {
  const token = localStorage.getItem('token');
  // Hide Dropdown Menu if user is not logged in
  const user = getUserFromToken();
  if (!user) {
    const dropdownMenu = document.getElementById('dropdown-menu');
    if (dropdownMenu) {
      dropdownMenu.style.display = 'none';
    }
  } else {
    // Show Dropdown Menu if user is student or professor
    if (user.role === 'student' || user.role === 'professor') {
      const dropdownMenu = document.getElementById('dropdown-menu');
      if (dropdownMenu) {
        dropdownMenu.style.display = 'block';
      }

      // Show the appropriate "My Applications" link based on role
      if (user.role === 'student') {
        const studentApplicationsLink = document.getElementById('student-applications-link');
        if (studentApplicationsLink) {
          studentApplicationsLink.style.display = 'block';
        }
      }

      if (user.role === 'professor') {
        const professorApplicationsLink = document.getElementById('professor-applications-link');
        if (professorApplicationsLink) {
          professorApplicationsLink.style.display = 'block';
        }
      }
    } else {
      // If user has a role other than student or professor, hide the dropdown
      const dropdownMenu = document.getElementById('dropdown-menu');
      if (dropdownMenu) {
        dropdownMenu.style.display = 'none';
      }
    }
  }

  // Hide Recommended Opportunities button if user is not a student
  if (!user || user.role !== 'student') {
    const recommendedButton = document.getElementById('recommended-opportunities-button');
    if (recommendedButton) {
      recommendedButton.style.display = 'none';
    }
  }

  // Hide "My Applications" links if user does not have the respective role
  if (!user || user.role !== 'student') {
    const studentApplicationsLink = document.getElementById('student-applications-link');
    if (studentApplicationsLink) {
      studentApplicationsLink.style.display = 'none';
    }
  }

  if (!user || user.role !== 'professor') {
    const professorApplicationsLink = document.getElementById('professor-applications-link');
    if (professorApplicationsLink) {
      professorApplicationsLink.style.display = 'none';
    }
  }

  // *** Optional: Show Logout and Hide Login Buttons if User is Logged In ***
  if (user) {
    const logoutButton = document.querySelector('.logout_button');
    const loginButton = document.querySelector('.login_button');
    if (logoutButton) {
      logoutButton.style.display = 'inline-block';
    }
    if (loginButton && !loginButton.classList.contains('logout_button')) { // Ensure not to hide the logout button
      loginButton.style.display = 'none';
    }
  }

  const form = document.getElementById('cv-upload-form');
  const messageDiv = document.getElementById('cv-message');
  const cvListDiv = document.getElementById('cv-list');

  // Function to fetch and display the list of CVs
  function loadCVs() {
    fetch('/api/my-cvs', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
      .then(response => response.json())
      .then(cvs => {
        cvListDiv.innerHTML = '';
        if (cvs.length === 0) {
          cvListDiv.innerHTML = '<p>You have not uploaded any CVs yet.</p>';
          return;
        }
        const cvList = document.createElement('ul');
        cvs.forEach(cv => {
          const cvItem = document.createElement('li');
          cvItem.innerHTML = `
            ${cv.originalName} - Uploaded on ${new Date(cv.uploadedAt).toLocaleString()}
            <button class="download-button" data-filename="${cv.filename}">Download</button>
          `;
          cvList.appendChild(cvItem);
        });
        cvListDiv.appendChild(cvList);

        // Attach event listeners to the new download buttons
        const downloadButtons = document.querySelectorAll('.download-button');
        downloadButtons.forEach(button => {
          button.addEventListener('click', function () {
            const filename = this.getAttribute('data-filename');
            downloadCV(filename);
          });
        });
      })
      .catch(error => {
        console.error('Error fetching CVs:', error);
        cvListDiv.innerHTML = '<p>Error loading your CVs.</p>';
      });
  }

  // Function to handle CV download
  function downloadCV(filename) {
    fetch(`/api/download-cv/${filename}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(response.statusText || 'Failed to download CV');
        }
        return response.blob();
      })
      .then(blob => {
        // Create a link element, set its href to the blob, and trigger a download
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename; // You can set this to the original filename if needed
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      })
      .catch(error => {
        console.error('Error downloading CV:', error);
        alert('Failed to download CV. Please try again.');
      });
  }

  // Load the CVs when the page loads
  loadCVs();

  form.addEventListener('submit', function (event) {
    event.preventDefault();

    const fileInput = document.getElementById('cv-file');
    const file = fileInput.files[0];

    if (!file) {
      messageDiv.innerHTML = '<p class="error">Please select a file to upload.</p>';
      return;
    }

    const formData = new FormData();
    formData.append('cv', file);

    fetch('/api/upload-cv', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: formData,
    })
      .then(async response => {
        const data = await response.json();
        if (!response.ok) {
          // Handle server errors
          throw new Error(data.message || 'Failed to upload CV.');
        }
        // Handle success
        if (data.opportunities) {
          // Store full opportunity details in localStorage
          localStorage.setItem('recommendedOpportunities', JSON.stringify(data.opportunities));

          messageDiv.innerHTML = '<p class="success">CV uploaded successfully. Navigate to recommended opportunities.</p>';
        } else {
          messageDiv.innerHTML = '<p class="success">CV uploaded successfully. No recommendations found.</p>';
        }
        loadCVs(); // Refresh CV list
      })
      .catch(error => {
        console.error('Error uploading CV:', error);
        messageDiv.innerHTML = `<p class="error">${error.message}</p>`;
      });

  });


});

function updateOpportunities(opportunities) {
  const opportunityListDiv = document.getElementById('opportunities-list');

  // Debugging: Ensure the element exists
  if (!opportunityListDiv) {
    console.error('Element with ID "opportunities-list" not found.');
    return;
  }

  console.log('Updating opportunities with:', opportunities); // Log the data

  opportunityListDiv.innerHTML = ''; // Clear existing opportunities

  if (opportunities.length === 0) {
    opportunityListDiv.innerHTML = '<p>No matching opportunities found.</p>';
    return;
  }

  opportunities.forEach(opportunity => {
    const oppElement = document.createElement('div');
    oppElement.className = 'opportunity-item';

    const title = document.createElement('h3');
    title.textContent = opportunity.title;

    const description = document.createElement('p');
    description.textContent = opportunity.description;

    oppElement.appendChild(title);
    oppElement.appendChild(description);

    opportunityListDiv.appendChild(oppElement);
  });
}
