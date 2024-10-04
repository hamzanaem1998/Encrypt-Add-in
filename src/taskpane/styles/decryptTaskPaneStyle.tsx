import { makeStyles } from '@fluentui/react-components';

const decryptTaskPaneStyle = makeStyles({
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

  // Style pour le conteneur des onglets
  tabsContainer: {
    display: 'flex',
    justifyContent: 'space-around',
    marginTop: '10px',
    marginBottom: '20px',
  },

  // Style pour chaque bouton d'onglet
  tabButton: {
    padding: '10px 20px',
    cursor: 'pointer',
    border: 'none',
    backgroundColor: '#f0f0f0',
    color: '#0078D4',
    fontSize: '16px',
    borderRadius: '4px',
  },

  // Style pour l'onglet actif
  activeTab: {
    backgroundColor: '#1079c9',
    color: '#ffffff',
  },

});

export default decryptTaskPaneStyle;
