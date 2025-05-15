import React, { useContext, useState, useMemo } from 'react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';

import { SessionContext } from '../contexts/SessionContext';
import callApi from '../utils/CallApi';
import FormField from './FormField';

import '../styles/pages.css';

const NewPlayerAndCharacterSchema = Yup.object().shape({
  name: Yup.string()
    .min(2, 'Player name is too short')
    .required('Player name is required'),
  summary: Yup.string().max(500, 'Summary is too long').nullable(),
  character: Yup.object().shape({
    name: Yup.string()
      .min(2, 'Character name is too short')
      .required('Character name is required'),
    character_class: Yup.string()
      .min(2, 'Class is too short')
      .required('Character class is required'),
    level: Yup.number()
      .integer('Level must be a whole number')
      .min(1, 'Level must be at least 1')
      .required('Level is required'),
    icon: Yup.string()
      .url('Icon URL must be a valid URL')
      .nullable()
      .transform(value => (value === '' ? null : value)),
    is_active: Yup.boolean(),
  }).required(),
});

const initialFormValues = {
  name: '',
  summary: '',
  character: {
    name: '',
    character_class: '',
    level: 1,
    icon: '',
    is_active: true,
  },
};

const gameSelectInputId = 'new-player-game-id-select';

export default function NewPlayer({ gameId: initialGameId, onSuccess }) {
  const { sessionData } = useContext(SessionContext);
  const gamesFromSession = useMemo(() => sessionData.user?.games || [], [sessionData.user?.games]);

  const [selectedGameId, setSelectedGameId] = useState(
    () => (initialGameId || (gamesFromSession.length > 0 ? gamesFromSession[0].id : '')).toString()
  );

  const gameOptionElements = useMemo(() => {
    return gamesFromSession.map(g => (
      <option key={g.id} value={g.id.toString()}>
        {g.title}
      </option>
    ));
  }, [gamesFromSession]);

  const handleGameSelectionChange = (event) => {
    setSelectedGameId(event.target.value);
  };

  const handlePlayerFormSubmit = async (values, { setSubmitting, setErrors, resetForm }) => {
    if (!selectedGameId) {
      setErrors({ server: 'Please select a game before adding the player.' });
      setSubmitting(false);
      return;
    }

    try {
      const gameIdToSubmit = Number(selectedGameId);
      const payload = {
        name: values.name,
        summary: values.summary || null,
        character: {
          ...values.character,
          level: Number(values.character.level),
          icon: values.character.icon || null,
        },
      };

      const responseData = await callApi(
        `/games/${gameIdToSubmit}/players?include=character`,
        {
          method: 'POST',
          body: JSON.stringify(payload),
        }
      );

      if (responseData?.id && responseData.character) {
        resetForm();
        if (typeof onSuccess === 'function') {
          onSuccess(gameIdToSubmit, responseData, responseData.character);
        }
        if (!initialGameId && gamesFromSession.length > 0) {
          setSelectedGameId(gamesFromSession[0].id.toString());
        } else if (initialGameId) {
          setSelectedGameId(initialGameId.toString());
        } else {
          setSelectedGameId('');
        }
      } else {
        console.warn('New Player API response was not as expected:', responseData);
        setErrors({ server: 'Failed to add player: Unexpected server response.' });
      }
    } catch (err) {
      console.error('API error response creating new player:', err);
      if (err.errors && typeof err.errors === 'object' && !Array.isArray(err.errors)) {
        setErrors(err.errors);
      } else {
        setErrors({ server: err.message || 'An unexpected error occurred. Please try again.' });
      }
    }
  };

  const renderFormContent = ({ isSubmitting, errors }) => (
    <Form noValidate className="new-player-form">
      {errors.server && (
        <div className="error-message server-error" role="alert">
          {errors.server}
        </div>
      )}

      <div className="form-group">
        <label htmlFor={gameSelectInputId} className="form-label">
          Associate with Game:
        </label>
        <select
          id={gameSelectInputId}
          name="gameSelection"
          value={selectedGameId}
          onChange={handleGameSelectionChange}
          className="form-select"
          aria-required="true"
        >
          <option value="" disabled={selectedGameId !== ""}>
            {gamesFromSession.length > 0 ? '-- Select a Game --' : '-- No Games Available --'}
          </option>
          {gameOptionElements}
        </select>
      </div>

      <fieldset className="form-fieldset">
        <legend className="form-legend">Player Information</legend>
        <FormField
          label="Player Name"
          name="name"
          type="text"
          placeholder="Enter player's name"
          autoComplete="off"
        />
        <FormField
          label="Player Summary (Optional)"
          name="summary"
          as="textarea"
          placeholder="A brief description of the player"
        />
      </fieldset>

      <fieldset className="form-fieldset">
        <legend className="form-legend">Starting Character</legend>
        <FormField
          label="Character Name"
          name="character.name"
          type="text"
          placeholder="Character's name"
        />
        <FormField
          label="Class"
          name="character.character_class"
          type="text"
          placeholder="e.g., Barbarian, Sorcerer"
        />
        <FormField
          label="Level"
          name="character.level"
          type="number"
          placeholder="1"
          min="1"
        />
        <FormField
          label="Icon URL (Optional)"
          name="character.icon"
          type="url"
          placeholder="https://example.com/character.png"
        />
        <FormField
          label="Character is Active"
          name="character.is_active"
          type="checkbox"
        />
      </fieldset>

      <div className="form-actions">
        <button
          type="submit"
          disabled={isSubmitting || !selectedGameId}
          className="button submit-button"
        >
          {isSubmitting ? 'Adding Player...' : 'Add Player and Character'}
        </button>
      </div>
    </Form>
  );

  return (
    <div className="new-player-container">
      <h3>Add New Player & Starting Character</h3>
      <Formik
        initialValues={initialFormValues}
        validationSchema={NewPlayerAndCharacterSchema}
        onSubmit={handlePlayerFormSubmit}
        enableReinitialize
      >
        {renderFormContent}
      </Formik>
    </div>
  );
}
