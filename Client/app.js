// app.js

document.addEventListener('DOMContentLoaded', function() {
  // Fetch opportunities from the backend
  fetch('/api/opportunities')
    .then(response => response.json())
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
      }
    })
    .catch(error => {
      console.error('Error fetching opportunities:', error);
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

      // Optionally, add the professor name
      const professor = document.createElement('p');
      professor.className = 'opportunity_item_professor';
      professor.textContent = opportunity.professor ? `Professor: ${opportunity.professor}` : '';

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
    detailProfessor.textContent = opportunity.professor ? `Professor: ${opportunity.professor}` : '';
    detailDepartment.textContent = opportunity.department ? `Department: ${opportunity.department}` : '';
  }
});
