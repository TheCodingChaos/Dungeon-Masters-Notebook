import { Link } from 'react-router-dom';
import "./CharacterCard.css";

export default function CharacterCard({ character, onEdit, onDelete }) {
  // Destructure character properties for readability
  const {
    id,
    name,
    icon,
    character_class: characterClass,
    level,
    is_active: isActive,
  } = character;

  return (
    <div className="character-card">
      {/* Character Icon */}
      {icon && (
        <img
          className="character-icon"
          src={icon}
          alt={`${name} icon`}
        />
      )}

      {/* Character Info */}
      <div>
        <Link to={`/characters/${id}`}>{name}</Link>
        <p>
          {characterClass} L{level} — {isActive ? 'Active' : 'Inactive'}
        </p>
      </div>

      {/* Edit/Delete Buttons */}
      <div>
        <button onClick={() => onEdit && onEdit(character)}>Edit</button>
        <button onClick={() => onDelete && onDelete(character)}>Delete</button>
      </div>
    </div>
  );
}