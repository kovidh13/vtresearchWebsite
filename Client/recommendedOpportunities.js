document.addEventListener('DOMContentLoaded', () => {
    const opportunitiesList = document.getElementById('opportunities-list');

    const storedOpportunities = localStorage.getItem('recommendedOpportunities');
    const opportunities = storedOpportunities ? JSON.parse(storedOpportunities) : [];

    opportunitiesList.innerHTML = '';

    if (opportunities.length === 0) {
        opportunitiesList.innerHTML = '<p>No recommended opportunities found.</p>';
        return;
    }

    opportunities.forEach(opportunity => {
        const oppElement = document.createElement('div');
        oppElement.className = 'opportunity-item';

        const title = document.createElement('h3');
        title.textContent = opportunity.title;

        const description = document.createElement('p');
        description.textContent = opportunity.description;

        const fullDescription = document.createElement('p');
        fullDescription.textContent = opportunity.fullDescription;

        const department = document.createElement('p');
        department.textContent = `Department: ${opportunity.department}`;

        const postedBy = document.createElement('p');
        postedBy.textContent = `Posted By: ${opportunity.postedBy?.username || 'Unknown'}`;

        oppElement.appendChild(title);
        oppElement.appendChild(description);
        oppElement.appendChild(fullDescription);
        oppElement.appendChild(department);
        oppElement.appendChild(postedBy);

        opportunitiesList.appendChild(oppElement);
    });
});
