import { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import Modal from './Modal';
import callApi from '../utils/CallApi';
import { SessionContext } from '../contexts/SessionContext';
import "./CharacterCard.css";

export default function CharacterCard({ character }) {
  // Destructure character properties for readability
  const {
    id,
    name,
    icon,
    character_class: characterClass,
    level,
    is_active: isActive,
  } = character;

  const { setSessionData } = useContext(SessionContext);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  // Edit form state
  const [editName, setEditName] = useState(name);
  const [editClass, setEditClass] = useState(characterClass);
  const [editLevel, setEditLevel] = useState(level);
  const [editIcon, setEditIcon] = useState(icon);
  const [editActive, setEditActive] = useState(isActive);

  // Handler for saving edits
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const updated = await callApi(
      `/characters/${id}`,
      {
        method: 'PATCH',
        body: JSON.stringify({
          name: editName,
          character_class: editClass,
          level: Number(editLevel),
          icon: editIcon,
          is_active: editActive,
        })
      }
    );
    setShowEditModal(false);
    setSessionData(prev => {
      const updatedGamesList = [];
      for (let i = 0; i < prev.user.games.length; i++) {
        const g = prev.user.games[i];
        const updatedPlayersList = [];
        for (let j = 0; j < g.players.length; j++) {
          const p = g.players[j];
          const updatedCharsList = [];
          for (let k = 0; k < p.characters.length; k++) {
            const ch = p.characters[k];
            if (ch.id === id) {
              updatedCharsList.push(updated);
            } else {
              updatedCharsList.push(ch);
            }
          }
          updatedPlayersList.push({ ...p, characters: updatedCharsList });
        }
        updatedGamesList.push({ ...g, players: updatedPlayersList });
      }
      return {
        ...prev,
        user: { ...prev.user, games: updatedGamesList }
      };
    });
  };

  // Handler for confirming delete
  const handleDeleteConfirm = async () => {
    await callApi(`/characters/${id}`, { method: 'DELETE' });
    setShowDeleteModal(false);
    setSessionData(prev => {
      const updatedGamesList = [];
      for (let i = 0; i < prev.user.games.length; i++) {
        const g = prev.user.games[i];
        const updatedPlayersList = [];
        for (let j = 0; j < g.players.length; j++) {
          const p = g.players[j];
          const filteredChars = [];
          for (let k = 0; k < p.characters.length; k++) {
            const ch = p.characters[k];
            if (ch.id !== id) {
              filteredChars.push(ch);
            }
          }
          updatedPlayersList.push({ ...p, characters: filteredChars });
        }
        updatedGamesList.push({ ...g, players: updatedPlayersList });
      }
      return {
        ...prev,
        user: { ...prev.user, games: updatedGamesList }
      };
    });
  };

  // Define the edit modal
  const editModal = showEditModal ? (
    <Modal isOpen onClose={() => setShowEditModal(false)}>
      <div style={{ padding: '1rem' }}>
        <h3>Edit Character</h3>
        <form onSubmit={handleEditSubmit}>
          <label>
            Name:
            <input value={editName} onChange={e => setEditName(e.target.value)} />
          </label>
          <label>
            Class:
            <input value={editClass} onChange={e => setEditClass(e.target.value)} />
          </label>
          <label>
            Level:
            <input
              type="number"
              value={editLevel}
              onChange={e => setEditLevel(e.target.value)}
            />
          </label>
          <label>
            Icon URL:
            <input value={editIcon} onChange={e => setEditIcon(e.target.value)} />
          </label>
          <label>
            Active:
            <input
              type="checkbox"
              checked={editActive}
              onChange={e => setEditActive(e.target.checked)}
            />
          </label>
          <button type="submit">Save</button>
          <button type="button" onClick={() => setShowEditModal(false)}>
            Cancel
          </button>
        </form>
      </div>
    </Modal>
  ) : null;

  // Define the delete modal
  const deleteModal = showDeleteModal ? (
    <Modal isOpen onClose={() => setShowDeleteModal(false)}>
      <div style={{ padding: '1rem' }}>
        <p>
          Are you sure you want to delete <strong>{name}</strong>?
        </p>
        <button onClick={handleDeleteConfirm}>Yes, delete</button>
        <button onClick={() => setShowDeleteModal(false)}>Cancel</button>
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
        <p>
          {characterClass} L{level} — {isActive ? 'Active' : 'Inactive'}
        </p>
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