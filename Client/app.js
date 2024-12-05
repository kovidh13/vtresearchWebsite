// Client/app.js

document.addEventListener('DOMContentLoaded', function () {
  const applyButton = document.getElementById('apply-button'); // applyButton
  const uploadCvPrompt = document.getElementById('upload-cv-prompt');
  let selectedOpportunityId = null; // selectedOpportunityId
  // Fetch opportunities from the backend
  fetch('/api/opportunities', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })
    .then(response => {
      if (!response.ok) {
        throw new Error(`Network response was not ok (${response.status})`);
      }
      return response.json();
    })
    .then(data => {
      displayOpportunityList(data);

      // Optionally, display the first opportunity's details by default
      if (data.length > 0) {
        displayOpportunityDetails(data[0]);

        // Set the first item as active
        const firstItem = document.querySelector('.opportunity_item');
        if (firstItem) {
          firstItem.classList.add('active');
        }
      } else {
        displayError('No research opportunities available at the moment.');
      }
    })
    .catch(error => {
      console.error('Error fetching opportunities:', error);
      displayError('Failed to load research opportunities. Please try again later.');
    });

    function uploadResume() {
      const fileInput = document.getElementById('resumeUpload');
      const file = fileInput.files[0];
    
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
          if (data.opportunities) {
            displayOpportunityList(data.opportunities); // Update with recommendations
          } else {
            alert('No matching recommendations. Current opportunities remain.');
          }
        })
        .catch(error => {
          console.error('Error uploading resume:', error);
          alert('Failed to process resume. Please try again.');
        });
    }
    
  // Function to display the list of opportunities
  function displayOpportunityList(opportunities) {
    const opportunityListDiv = document.getElementById('opportunities-list');
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
  
  // Function to display opportunity details
  function displayOpportunityDetails(opportunity) {
    const detailTitle = document.getElementById('detail-title');
    const detailDescription = document.getElementById('detail-description');
    const detailProfessor = document.getElementById('detail-professor');
    const detailDepartment = document.getElementById('detail-department');

    detailTitle.textContent = opportunity.title;
    detailDescription.textContent = opportunity.fullDescription || opportunity.description || 'No description available.';
    detailProfessor.textContent = opportunity.postedBy && opportunity.postedBy.username
      ? `Professor: ${opportunity.postedBy.username}`
      : 'Professor: N/A';
    detailDepartment.textContent = opportunity.department
      ? `Department: ${opportunity.department}`
      : 'Department: N/A';

    selectedOpportunityId = opportunity._id; // Store the selected opportunity ID

    // Check if the user is logged in and is a student
    const user = getUserFromToken();
    if (user && user.role === 'student') {
      checkCvAvailability().then(hasCV => {
        if (hasCV) {
          applyButton.style.display = 'block';
          uploadCvPrompt.style.display = 'none';
        } else {
          applyButton.style.display = 'none';
          uploadCvPrompt.style.display = 'block';
        }
      });
    } else {
      applyButton.style.display = 'none';
      uploadCvPrompt.style.display = 'none';
    }
  }

  // Event listener for the Apply button
  if (applyButton) {
    applyButton.addEventListener('click', function () {
      // Ensure the user is logged in
      const token = localStorage.getItem('token');
      const user = getUserFromToken();

      if (!token || !user || user.role !== 'student') {
        alert('You must be logged in as a student to apply.');
        return;
      }

      // Send the application request to the server
      fetch(`/api/opportunities/${selectedOpportunityId}/apply`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
        .then(response => response.json())
        .then(data => {
          if (data.message === 'Application submitted successfully') {
            alert('Application submitted successfully!');
          } else {
            alert(`Error: ${data.message}`);
          }
        })
        .catch(error => {
          console.error('Error submitting application:', error);
          alert('An error occurred. Please try again later.');
        });
    });
  }

  function checkCvAvailability() {
    const token = localStorage.getItem('token');
    return fetch('/api/my-cvs', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
      .then(response => response.json())
      .then(cvs => {
        return cvs.length > 0;
      })
      .catch(error => {
        console.error('Error checking CVs:', error);
        return false;
      });
  }

  applyButton.addEventListener('click', function () {
    // Ensure the user is logged in
    const token = localStorage.getItem('token');
    const user = getUserFromToken();

    if (!token || !user || user.role !== 'student') {
      alert('You must be logged in as a student to apply.');
      return;
    }

    // Send the application request to the server
    fetch(`/api/opportunities/${selectedOpportunityId}/apply`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
      .then(response => response.json())
      .then(data => {
        if (data.message === 'Application submitted successfully') {
          alert('Application submitted successfully!');
        } else {
          alert(`Error: ${data.message}`);
        }
      })
      .catch(error => {
        console.error('Error submitting application:', error);
        alert('An error occurred. Please try again later.');
      });
  });

  // Function to display error messages
  function displayError(message) {
    const listContainer = document.getElementById('opportunities-list');
    listContainer.innerHTML = `<p class="error">${message}</p>`;
  }

  function getUserFromToken() {
    const token = localStorage.getItem('token');
    if (!token) return null;

    try {
      const payload = token.split('.')[1];
      const decodedPayload = JSON.parse(atob(payload));
      return decodedPayload;
    } catch (e) {
      console.error('Error decoding token:', e);
      return null;
    }
  }
});