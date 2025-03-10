// Success Page Survey Overlay with Slack Integration
(function() {
    // Only run on success page - ADJUST THIS PATH TO MATCH YOUR SUCCESS PAGE URL
    //if (!window.location.pathname.includes('/success')) return;
    
    // Configuration
    const config = {
      question: "Thank you for choosing Martin Randall Travel. Before you go, was there anything that almost prevented you from completing your reservation today?",
      thankYouMessage: "Thank you for your feedback! We appreciate your input.",
      // Update this URL with your new web app URL
      googleScriptUrl: "https://script.google.com/macros/s/YOUR_NEW_DEPLOYMENT_ID/exec"
    };
    
    // Create and append CSS to head
    const style = document.createElement('style');
    style.textContent = `
      .survey-overlay {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background-color: rgba(255, 255, 255, 0.95);
        padding: 25px;
        border-radius: 5px;
        border: 0 !important;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
        z-index: 10000;
        max-width: 90%;
        width: 450px;
        font-family: 'Pelago', 'Segoe UI', 'Helvetica Neue', sans-serif;
        color: #262626;
        outline: none;
      }
      .survey-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 9999;
      }
      .survey-title {
        margin-top: 0;
        margin-bottom: 15px;
        font-size: 18px;
        font-weight: normal;
        font-family: 'Pelago', 'Segoe UI', 'Helvetica Neue', sans-serif;
        color: #262626;
      }
      .survey-textarea {
        width: 100%;
        height: 100px;
        margin: 10px 0;
        padding: 10px;
        box-sizing: border-box;
        border: 1px solid #ccc;
        border-radius: 4px;
        resize: vertical;
        font-family: 'Pelago', 'Segoe UI', 'Helvetica Neue', sans-serif;
        color: #262626;
      }
      .survey-buttons {
        display: flex;
        justify-content: space-between;
        margin-top: 15px;
      }
      .survey-submit, .survey-close {
        padding: 10px 20px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-family: 'Pelago', 'Segoe UI', 'Helvetica Neue', sans-serif;
      }
      .survey-submit {
        background-color: #6d2463;
        color: white;
        transition: background-color 0.3s ease;
      }
      .survey-submit:hover {
        background-color: #5a1e52;
      }
      .survey-close {
        background-color: #f1f1f1;
        color: #262626;
      }
      .survey-thanks {
        text-align: center;
        padding: 20px;
        font-family: 'Pelago', 'Segoe UI', 'Helvetica Neue', sans-serif;
        color: #262626;
      }
    `;
    document.head.appendChild(style);
    
    // Create survey HTML
    const surveyHtml = `
      <div class="survey-backdrop"></div>
      <div class="survey-overlay">
        <h3 class="survey-title">${config.question}</h3>
        <textarea class="survey-textarea" placeholder="Your feedback..."></textarea>
        <div class="survey-buttons">
          <button class="survey-close">No thanks</button>
          <button class="survey-submit">Submit feedback</button>
        </div>
      </div>
    `;
    
    // Create survey container
    const surveyContainer = document.createElement('div');
    surveyContainer.id = 'survey-container';
    surveyContainer.innerHTML = surveyHtml;
    document.body.appendChild(surveyContainer);
    
    // Get MS Clarity ID if available
    function getClarityId() {
      // Look for MS Clarity ID (depends on how Clarity is implemented)
      if (window.clarity && window.clarity.v) {
        return window.clarity.v;
      } else if (window.localStorage && window.localStorage.getItem('_clarity')) {
        return window.localStorage.getItem('_clarity');
      } else {
        // Try to get from cookies
        const match = document.cookie.match(/(^|;)\\s*_clarity=([^;]+)/);
        return match ? match[2] : 'not_found';
      }
    }
    
    // Function to submit feedback with better error handling
    function submitFeedback(feedback) {
      console.log("Submitting feedback, length:", feedback.length);
      
      const clarityId = getClarityId();
      const timestamp = new Date().toISOString();
      const pageUrl = window.location.href;
      
      // Prepare data
      const data = {
        timestamp: timestamp,
        feedback: feedback,
        clarityId: clarityId,
        url: pageUrl
      };
      
      console.log("Data to send:", data);
      
      // Convert data to string for sending
      const jsonData = JSON.stringify(data);
      console.log("JSON data:", jsonData);
      
      // Try POST first (preferred method)
      try {
        console.log("Attempting POST request to:", config.googleScriptUrl);
        
        fetch(config.googleScriptUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain' // Use text/plain to avoid CORS preflight
          },
          body: jsonData,
          mode: 'no-cors'
        }).then(response => {
          console.log("POST successful, response status:", response.status);
          return true;
        }).catch(error => {
          console.error("POST failed:", error);
          tryGetMethod();
        });
      } catch (error) {
        console.error("Error in POST attempt:", error);
        tryGetMethod();
      }
      
      // Fallback to GET if POST fails
      function tryGetMethod() {
        try {
          console.log("Attempting GET request");
          
          // For GET requests, we need to encode the data in the URL
          const queryStringData = encodeURIComponent(jsonData);
          const url = `${config.googleScriptUrl}?data=${queryStringData}`;
          
          // Check if URL is too long (browser limits)
          if (url.length > 2000) {
            console.warn("URL too long for GET method:", url.length);
            tryImageMethod();
            return;
          }
          
          fetch(url, {
            method: 'GET',
            mode: 'no-cors'
          }).then(response => {
            console.log("GET successful, response status:", response.status);
          }).catch(error => {
            console.error("GET failed:", error);
            tryImageMethod();
          });
        } catch (error) {
          console.error("Error in GET attempt:", error);
          tryImageMethod();
        }
      }
      
      // Last resort - Image method
      function tryImageMethod() {
        try {
          console.log("Attempting Image fallback method");
          
          // For extreme fallback with minimal data
          const minimalData = {
            f: feedback.substring(0, 100), // Truncate feedback to avoid URL length issues
            t: timestamp,
            u: pageUrl.substring(0, 100)  // Truncate URL too
          };
          
          const queryString = encodeURIComponent(JSON.stringify(minimalData));
          const imgUrl = `${config.googleScriptUrl}?img=1&data=${queryString}`;
          
          const img = new Image();
          img.onload = function() {
            console.log("Image method completed");
          };
          img.onerror = function() {
            console.error("Image method failed");
          };
          img.src = imgUrl;
        } catch (error) {
          console.error("Error in image method attempt:", error);
        }
      }
      
      // Return true to indicate we tried to submit
      return true;
    }
    
    // Function to show thank you message
    function showThankYou() {
      const overlay = document.querySelector('.survey-overlay');
      overlay.innerHTML = `<div class="survey-thanks">${config.thankYouMessage}</div>`;
      
      // Hide after 3 seconds
      setTimeout(() => {
        const container = document.getElementById('survey-container');
        if (container) {
          container.remove();
        }
      }, 3000);
    }
    
    // Event listeners
    document.querySelector('.survey-submit').addEventListener('click', function() {
      const feedback = document.querySelector('.survey-textarea').value.trim();
      
      if (feedback) {
        submitFeedback(feedback);
        showThankYou();
      } else {
        alert("Please enter some feedback before submitting.");
      }
    });
    
    // Close button
    document.querySelector('.survey-close').addEventListener('click', function() {
      const container = document.getElementById('survey-container');
      if (container) {
        container.remove();
      }
    });
    
    // Close when clicking backdrop
    document.querySelector('.survey-backdrop').addEventListener('click', function(e) {
      if (e.target === this) {
        const container = document.getElementById('survey-container');
        if (container) {
          container.remove();
        }
      }
    });
    
    // Log that the survey was initialized
    console.log("Survey initialized on " + window.location.href);
  })();
