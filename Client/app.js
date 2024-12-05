// Client/app.js

document.addEventListener('DOMContentLoaded', function () {
  const applyButton = document.getElementById('apply-button');
  const uploadCvPrompt = document.getElementById('upload-cv-prompt');
  let selectedOpportunityId = null;

  // CV Selection Modal Elements
  const cvSelectionModal = document.getElementById('cvSelectionModal');
  const closeModalButton = document.querySelector('.close-button');
  const cvSelectionForm = document.getElementById('cv-selection-form');
  const cvOptionsContainer = document.getElementById('cv-options');

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

  // Function to display the list of opportunities
  function displayOpportunityList(opportunities) {
    const listContainer = document.getElementById('opportunities-list');
    listContainer.innerHTML = ''; // Clear existing content

    opportunities.forEach(opportunity => {
      // Create the item div with class 'opportunity_item'
      const item = document.createElement('div');
      item.className = 'opportunity_item';

      // Create the title element
      const title = document.createElement('h3');
      title.className = 'opportunity_item_title';
      title.textContent = opportunity.title;

      // Add the professor name using 'postedBy.username'
      const professor = document.createElement('p');
      professor.className = 'opportunity_item_professor';
      professor.textContent = opportunity.postedBy && opportunity.postedBy.username
        ? `Professor: ${opportunity.postedBy.username}`
        : 'Professor: N/A';

      // Append title and professor to the item
      item.appendChild(title);
      item.appendChild(professor);

      // Add click event listener
      item.addEventListener('click', () => {
        // Remove active class from other items
        const items = document.querySelectorAll('.opportunity_item');
        items.forEach(i => i.classList.remove('active'));
        item.classList.add('active');

        // Display opportunity details
        displayOpportunityDetails(opportunity);
      });

      // Append item to the list container
      listContainer.appendChild(item);
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

  // Function to open the CV selection modal
  function openCvSelectionModal() {
    fetch('/api/my-cvs', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to fetch CVs (${response.status})`);
        }
        return response.json();
      })
      .then(cvs => {
        if (cvs.length === 0) {
          alert('No CVs available. Please upload a CV first.');
          uploadCvPrompt.style.display = 'block';
          return;
        }
        // Populate the modal with CV options
        cvOptionsContainer.innerHTML = '';
        cvs.forEach(cv => {
          const label = document.createElement('label');
          label.style.display = 'block';
          const radio = document.createElement('input');
          radio.type = 'radio';
          radio.name = 'selectedCv';
          radio.value = cv._id; // Using cvId (Correct)
          if (cvs.indexOf(cv) === 0) {
            radio.checked = true; // Select the first CV by default
          }
          label.appendChild(radio);
          label.appendChild(document.createTextNode(` ${cv.filename} (Uploaded on ${new Date(cv.uploadedAt).toLocaleDateString()})`));
          cvOptionsContainer.appendChild(label);
        });

        // Show the modal
        cvSelectionModal.style.display = 'block';
      })
      .catch(error => {
        console.error('Error fetching CVs:', error);
        alert('Failed to load CVs. Please try again later.');
      });
  }

  // Event listener to close the modal
  closeModalButton.addEventListener('click', () => {
    cvSelectionModal.style.display = 'none';
  });

  // Event listener for clicking outside the modal to close it
  window.addEventListener('click', (event) => {
    if (event.target == cvSelectionModal) {
      cvSelectionModal.style.display = 'none';
    }
  });

  // Handle the CV selection form submission
  cvSelectionForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const selectedCv = document.querySelector('input[name="selectedCv"]:checked');
    if (!selectedCv) {
      alert('Please select a CV to apply with.');
      return;
    }
    submitApplication(selectedCv.value); // Pass the selected CV's ID (Correct)
    cvSelectionModal.style.display = 'none';
  });

  // Function to submit the application with the selected CV
  function submitApplication(selectedCvId) {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('You must be logged in to apply.');
      return;
    }

    fetch(`/api/opportunities/${selectedOpportunityId}/apply`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ cvId: selectedCvId }), // Send the selected CV's ID (Correct)
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

      // Open the CV selection modal
      openCvSelectionModal();
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
