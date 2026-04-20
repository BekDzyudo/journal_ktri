export const getFetchData = async (url) => {
    const result = {
      data: [],
      error: null,
    };
  
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      result.data = await response.json();
    } catch (err) {
      result.error = err.message;
      
    }
  
    return result; // data va error holatlarini qaytaradi
  };
  export default getFetchData
  