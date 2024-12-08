// Client/myCV.js

document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
    const user = getUserFromToken();
  
    if (!token || user.role !== 'student') {
      alert('Access denied. Only students can access this page.');
      window.location.href = 'researchIndex.html';
      return;
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
              ${cv.filename} - Uploaded on ${new Date(cv.uploadedAt).toLocaleString()}
              <a href="/download-cv/${cv.filename}" target="_blank">Download</a>
            `;
            cvList.appendChild(cvItem);
          });
          cvListDiv.appendChild(cvList);
        })
        .catch(error => {
          console.error('Error fetching CVs:', error);
          cvListDiv.innerHTML = '<p>Error loading your CVs.</p>';
        });
    }
  
    // Load the CVs when the page loads
    loadCVs();
  
    form.addEventListener('submit', function(event) {
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
        .then(response => response.json())
        .then(data => {
            console.log('Matched Opportunities:', data.opportunities); // Debugging
    
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
            if (error.response) {
                messageDiv.innerHTML = `<p class="error">${error.response.data.message || 'An error occurred.'}</p>`;
            } else {
                messageDiv.innerHTML = '<p class="error">Unable to connect to the server. Please try again later.</p>';
            }
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
  
  