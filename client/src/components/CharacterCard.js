

import React from 'react';
import { Link } from 'react-router-dom';

export default function CharacterCard({ character, onEdit, onDelete }) {
  return (
    <div className="character-card">
      {character.icon && (
        <img
          src={character.icon}
          alt={`${character.name} icon`}
          style={{ maxWidth: '40px', marginRight: '0.5rem' }}
        />
      )}
      <div>
        <Link to={`/characters/${character.id}`}>{character.name}</Link>
        <p>
          {character.character_class} L{character.level} —{' '}
          {character.is_active ? 'Active' : 'Inactive'}
        </p>
      </div>
      <div>
        <button onClick={() => onEdit && onEdit(character)}>Edit</button>
        <button onClick={() => onDelete && onDelete(character)}>Delete</button>
      </div>
    </div>
  );
}