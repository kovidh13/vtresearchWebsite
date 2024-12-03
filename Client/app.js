// Select the container using getElementById
const container = document.getElementById('opportunities-container');

// Fetch opportunities from the backend
fetch('/api/opportunities')
  .then(response => response.json())
  .then(data => {
    // Clear any existing content
    container.innerHTML = '';

    // Loop through each opportunity
    data.forEach(opportunity => {
      // Create the outer div with class 'opportunity-box'
      const opportunityDiv = document.createElement('div');
      opportunityDiv.className = 'opportunity-box';

      // Create the title
      const title = document.createElement('h3');
      title.className = 'opportunity-title';
      title.textContent = opportunity.title;

      // Append the title to the opportunityDiv
      opportunityDiv.appendChild(title);

      // Create the description if available
      if (opportunity.description && opportunity.description !== 'N/A') {
        const description = document.createElement('p');
        description.className = 'opportunity-description';
        description.textContent = opportunity.description;
        opportunityDiv.appendChild(description);
      }

      // Create the link
      const link = document.createElement('a');
      link.className = 'cta_button';
      link.textContent = 'View More on VT Website';
      link.href = opportunity.link;
      link.target = '_blank'; // Open in a new tab

      // Append the link to the opportunityDiv
      opportunityDiv.appendChild(link);

      // Append opportunityDiv to the container
      container.appendChild(opportunityDiv);
    });
  })
  .catch(error => {
    console.error('Error fetching opportunities:', error);
  });