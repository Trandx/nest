interface CheckingResponse {
  format ?: boolean,
  domain ?: string,
  disposable: boolean,
  dns?: boolean
}

export const blackListEmail = async (email: string, emailValidatorUrl?: string) => {
    try {
      // Construct the URL
      const defaultUrl = 'https://open.kickbox.com/v1/disposable'
      
      const url = `${ emailValidatorUrl || defaultUrl}/${encodeURIComponent(email)}`;
      
      // Make the API request
      const response = await fetch(url);
  
      // Handle non-200 responses
      if (!response.ok) {
        throw new Error(`API responded with status ${response.status}`);
      }
  
      // Parse the response JSON
      const data: CheckingResponse = await response.json();
      
      if(data.format === false){
        return true
      }

      if(data.dns === false){
        return true
      }
  
      // Return the validation result
      return data.disposable;
    } catch (error) {
      console.error('Error validating email:', error);
      // Handle errors appropriately (e.g., network issues, API errors)
      throw error;
    }
  };