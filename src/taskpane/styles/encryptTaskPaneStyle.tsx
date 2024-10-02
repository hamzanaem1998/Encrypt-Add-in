import { makeStyles } from '@fluentui/react-components';

const encryptTaskPaneStyle = makeStyles({
    bodyContainer: {
      maxWidth: '600px', 
      margin: '0 auto', 
      padding: '20px', 
      backgroundColor: '#f9f9f9', 
      borderRadius: '8px', 
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    },

    titleTaskPane: {
        textAlign: 'center', 
        color: '#0078D4',
    },

    formContainer: {
        display: 'flex', 
        flexDirection: 'column', 
        gap: '15px',
    },

    inputFile: {
        padding: '8px', 
        border: '1px solid #ddd', 
        borderRadius: '4px',
    },

    chiffrerButton: {
        padding: '10px', 
        backgroundColor: '#0078D4', 
        color: '#fff',
    },

    keyParagraphe: {
        marginTop: '15px', 
        color: '#444',
    }
    
  });

export default encryptTaskPaneStyle;
