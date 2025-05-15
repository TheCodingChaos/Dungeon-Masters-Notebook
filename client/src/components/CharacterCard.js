import { useState, useContext, useEffect } from 'react'; // Added useEffect
import { Link } from 'react-router-dom';
import Modal from './Modal';
import callApi from '../utils/CallApi';
import { SessionContext } from '../contexts/SessionContext';
import "./CharacterCard.css";

export default function CharacterCard({ character }) {
  // Destructure character properties - good practice
  const {
    id,
    name,
    icon,
    character_class: characterClass, // Renaming is good
    level,
    is_active: isActive,
  } = character;

  const { setSessionData } = useContext(SessionContext);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Edit form state
  // An experienced junior might group related form state
  const [editForm, setEditForm] = useState({
    name: name,
    characterClass: characterClass,
    level: level,
    icon: icon || '', // Ensure icon has a default for input
    isActive: isActive,
  });

  // Effect to reset form state if the character prop changes or when modal opens
  // This shows more attention to form lifecycle
  useEffect(() => {
    if (showEditModal) {
      setEditForm({
        name: name,
        characterClass: characterClass,
        level: level,
        icon: icon || '',
        isActive: isActive,
      });
    }
  }, [showEditModal, name, characterClass, level, icon, isActive, character]); // character added to deps for completeness

  const handleFormChange = (e) => {
    const { name: inputName, value, type, checked } = e.target;
    setEditForm(prevForm => ({
      ...prevForm,
      [inputName]: type === 'checkbox' ? checked : value,
    }));
  };

  // Handler for saving edits
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const updatedCharacter = await callApi(
        `/characters/${id}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            name: editForm.name,
            character_class: editForm.characterClass,
            level: Number(editForm.level),
            icon: editForm.icon,
            is_active: editForm.isActive,
          }),
        }
      );

      // Assuming callApi throws for network errors, but might return error structure for validation
      if (updatedCharacter && updatedCharacter.error) {
        console.error("Failed to update character:", updatedCharacter.error);
        alert(`Error: ${updatedCharacter.error.message || 'Could not update character.'}`);
        return;
      }

      setShowEditModal(false);
      // Using .map() for cleaner immutable updates
      setSessionData(prev => ({
        ...prev,
        user: {
          ...prev.user,
          games: prev.user.games.map(game => ({
            ...game,
            players: game.players.map(player => ({
              ...player,
              characters: player.characters.map(char =>
                char.id === id ? updatedCharacter : char
              ),
            })),
          })),
        },
      }));
    } catch (error) {
      console.error("API call failed during edit:", error);
      alert("An error occurred while saving changes. Please try again.");
    }
  };

  // Handler for confirming delete
  const handleDeleteConfirm = async () => {
    try {
      await callApi(`/characters/${id}`, { method: 'DELETE' });
      // No error means success
      setShowDeleteModal(false);
      setSessionData(prev => ({
        ...prev,
        user: {
          ...prev.user,
          games: prev.user.games.map(game => ({
            ...game,
            players: game.players.map(player => ({
              ...player,
              characters: player.characters.filter(char => char.id !== id),
            })),
          })),
        },
      }));
    } catch (error) {
      console.error("API call failed during delete:", error);
      alert("An error occurred while deleting the character. Please try again.");
      // Optionally keep modal open or close it depending on desired UX for errors
      // setShowDeleteModal(false);
    }
  };

  const editModal = showEditModal ? (
    <Modal isOpen onClose={() => setShowEditModal(false)}>
      <div style={{ padding: '1rem' }}>
        <h3>Edit Character: {name}</h3>
        <form onSubmit={handleEditSubmit}>
          <label htmlFor="editName">Name:</label>
          <input id="editName" name="name" value={editForm.name} onChange={handleFormChange} required />
          <br />
          <label htmlFor="editClass">Class:</label>
          <input id="editClass" name="characterClass" value={editForm.characterClass} onChange={handleFormChange} required />
          <br />
          <label htmlFor="editLevel">Level:</label>
          <input
            id="editLevel"
            name="level"
            type="number"
            value={editForm.level}
            onChange={handleFormChange}
            required min="1"
          />
          <br />
          <label htmlFor="editIcon">Icon URL:</label>
          <input id="editIcon" name="icon" value={editForm.icon} onChange={handleFormChange} />
          <br />
          <label htmlFor="editActive">Active:</label>
          <input
            id="editActive"
            name="isActive"
            type="checkbox"
            checked={editForm.isActive}
            onChange={handleFormChange}
          />
          <br /><br />
          <button type="submit">Save Changes</button>
          <button type="button" onClick={() => setShowEditModal(false)}>Cancel</button>
        </form>
      </div>
    </Modal>
  ) : null;

  const deleteModal = showDeleteModal ? (
    <Modal isOpen onClose={() => setShowDeleteModal(false)}>
      <div style={{ padding: '1rem' }}>
        <p>Are you sure you want to delete <strong>{name}</strong>?</p>
        <button onClick={handleDeleteConfirm} style={{marginRight: "10px"}}>Yes, delete</button>
        <button type="button" onClick={() => setShowDeleteModal(false)}>Cancel</button>
      </div>
    </Modal>
  ) : null;

  return (
    <div className="character-card">
      {icon && (
        <img className="character-icon" src={icon} alt={`${name} icon`} />
      )}
      <div>
        <Link to={`/characters/${id}`}>{name}</Link>
        <p>{characterClass} L{level} — {isActive ? 'Active' : 'Inactive'}</p>
      </div>
      <div>
        <button onClick={() => setShowEditModal(true)}>Edit</button>
        <button onClick={() => setShowDeleteModal(true)}>Delete</button>
      </div>
      {editModal}
      {deleteModal}
    </div>
  );
}