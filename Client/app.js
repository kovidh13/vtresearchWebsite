const container = document.getElementsByClassName('opportunities-container')[0];
// Fetch opportunities from the backend
fetch('/api/opportunities')
  .then(response => response.json())
  .then(data => {
    // Clear any existing content
    container.innerHTML = '';

    // Loop through each opportunity
    data.forEach(opportunity => {
      // Create the outer div with class 'background'
      const opportunityDiv = document.createElement('div');
      opportunityDiv.className = 'background';

      // Create the title
      const title = document.createElement('h3');
      title.className = 'title';
      title.textContent = opportunity.title;

      // Create the description
      const description = document.createElement('p');
      description.className = 'professor';
      description.textContent = `Description: ${opportunity.description || 'N/A'}`;

      // Create the button
      const button = document.createElement('button');
      button.className = 'cta_button';
      button.textContent = 'View More';

      // Attach an event listener to the button
      button.addEventListener('click', () => {
        // Function to display detailed information
        showDetails(opportunity);
      });

      // Append elements to the opportunityDiv
      opportunityDiv.appendChild(title);
      opportunityDiv.appendChild(description);
      opportunityDiv.appendChild(button);

      // Append opportunityDiv to the container
      container.appendChild(opportunityDiv);
    });
  })
  .catch(error => {
    console.error('Error fetching opportunities:', error);
  });


  function showDetails(opportunity) {
    // Get the details box element
    const detailsBox = document.getElementById('details-box');
  
    // Make the details box visible
    detailsBox.style.display = 'block';
  
    // Update the title
    const detailTitle = document.getElementById('detail-title');
    detailTitle.textContent = opportunity.title;
  
    // Update the description
    const detailDescription = document.getElementById('detail-description');
    detailDescription.textContent = opportunity.fullDescription || opportunity.description || 'N/A';
  
    // Update the "View More On Virginia Tech's Website" button
    const detailButton = document.getElementById('detail-button');
    if (opportunity.link) {
      detailButton.style.display = 'inline-block';
      detailButton.onclick = () => {
        window.open(opportunity.link, '_blank');
      };
    } else {
      detailButton.style.display = 'none';
    }
  }
  
