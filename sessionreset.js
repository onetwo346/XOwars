// sessionReset.js

// Function to fetch the visitor's IP address
async function getVisitorIP() {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip; // Returns the visitor's IP address
  } catch (error) {
    console.error('Error fetching IP address:', error);
    return null;
  }
}

// Function to reset stored data for new visitors
async function resetDataForNewIP() {
  // Fetch the current IP address
  const currentIP = await getVisitorIP();

  // Get the stored IP address from sessionStorage
  const storedIP = sessionStorage.getItem('visitorIP');

  // If the IP address is new or doesn't exist, reset stored data
  if (currentIP !== storedIP) {
    console.log('New IP detected. Resetting stored data...');

    // Clear localStorage (or any other stored data)
    localStorage.clear();

    // Store the new IP address in sessionStorage
    sessionStorage.setItem('visitorIP', currentIP);
  } else {
    console.log('Returning visitor. No reset needed.');
  }
}

// Run the IP check and reset logic when the page loads
resetDataForNewIP();
