import React, { useContext, useState, useMemo } from 'react';
import { Formik, Form, FieldArray } from 'formik';
import * as Yup from 'yup';
import FormField from './FormField';
import Modal from './Modal';
import callApi from '../utils/CallApi';
import { SessionContext } from '../contexts/SessionContext';

// Internal validation for character entries
const CharacterSchemaInternal = Yup.object().shape({
  name: Yup.string().required('Character name is required'),
  character_class: Yup.string().required('Character class is required'),
  level: Yup.number()
    .min(1, 'Level must be at least 1')
    .integer('Level must be a whole number')
    .required('Level is required'),
  icon: Yup.string()
    .url('Icon URL must be valid')
    .nullable()
    .transform(v => (v === '' ? null : v)),
  is_active: Yup.boolean(),
});

// Internal validation for assignments
const AssignmentSchemaInternal = Yup.object().shape({
  player_id: Yup.string().when('player', {
    is: p => !p || !p.name,
    then: schema => schema.required('Existing player is required'),
    otherwise: schema => schema.nullable(),
  }),
  player: Yup.object().shape({
    name: Yup.string().when('player_id', {
      is: val => !val,
      then: schema => schema.required('New player name is required'),
      otherwise: schema => schema.nullable(),
    }),
    summary: Yup.string().nullable(),
  }).nullable(),
  character: CharacterSchemaInternal.required('Character is required'),
});

// Validation for the entire form
const NewGameSchema = Yup.object().shape({
  title: Yup.string().required('Game title is required'),
  system: Yup.string().required('Game system is required'),
  status: Yup.string().required('Game status is required'),
  description: Yup.string().nullable(),
  setting: Yup.string().nullable(),
  start_date: Yup.date()
    .nullable()
    .transform(v => (v instanceof Date && !isNaN(v) ? v : null)),
  assignments: Yup.array().of(AssignmentSchemaInternal).nullable(),
});

export default function NewGameWithAssignments({ onSuccess }) {
  const { sessionData } = useContext(SessionContext);
  const [modalConfig, setModalConfig] = useState({ isOpen: false, type: null, assignmentIndex: null });

  // Compute unique players once per sessionData change
  const uniquePlayers = useMemo(() => {
    const all = [];
    const user = sessionData.user;
    if (!user) return [];
    if (user.players) all.push(...user.players);
    if (user.games) user.games.forEach(g => g.players && all.push(...g.players));
    return Array.from(new Map(all.filter(p => p && p.id).map(p => [p.id, p])).values());
  }, [sessionData.user]);

  // Initial form values
  const initialGameFormValues = {
    title: '',
    system: '',
    status: '',
    description: '',
    setting: '',
    start_date: '',
    assignments: [],
  };

  // Submit handler with robust error parsing
  const handleMainFormSubmit = async (values, { setErrors, resetForm, setSubmitting }) => {
    const assignmentsToSubmit = values.assignments.filter(a =>
      (a.player_id || (a.player && a.player.name)) && a.character.name
    );
    const payload = { ...values, assignments: assignmentsToSubmit };
    try {
      const newGame = await callApi('/games', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (newGame?.id) {
        resetForm();
        onSuccess?.(newGame);
      } else {
        console.warn('Unexpected API response:', newGame);
        setErrors({ server: 'Failed to create game: Unexpected server response.' });
      }
    } catch (err) {
      console.error('Error creating game:', err);
      if (err.errors && typeof err.errors === 'object' && !Array.isArray(err.errors)) {
        setErrors(err.errors);
      } else {
        setErrors({ server: err.message || 'An unexpected error occurred. Please try again.' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Add assignment (player or new player)
  const handleAddAssignmentType = (event, arrayHelpers) => {
    const val = event.target.value;
    if (!val) return;
    event.target.value = '';
    const defaultAssign = { player_id: '', player: null, character: { name: '', character_class: '', level: 1, icon: '', is_active: false } };
    const idx = arrayHelpers.form.values.assignments.length;
    if (val === '__new_player') {
      arrayHelpers.push({ ...defaultAssign, player: { name: '', summary: '' } });
      setModalConfig({ isOpen: true, type: 'player', assignmentIndex: idx });
    } else {
      const playerIdNum = Number(val);
      arrayHelpers.push({ ...defaultAssign, player_id: playerIdNum });
      setModalConfig({ isOpen: true, type: 'character', assignmentIndex: idx });
    }
  };

  // Render each assignment item
  const renderAssignmentListItem = (assignment, index, arrayHelpers) => {
    const playerName = assignment.player_id
      ? uniquePlayers.find(p => p.id === assignment.player_id)?.name
      : assignment.player?.name;
    return (
      <div key={index} className="assignment-item">
        <span className="assignment-info">
          {playerName} / {assignment.character.name}
        </span>
        <div className="assignment-actions">
          <button
            type="button"
            className="button-edit"
            onClick={() => setModalConfig({
              isOpen: true,
              type: assignment.player ? 'player' : 'character',
              assignmentIndex: index,
            })}
          >
            Edit
          </button>
          <button
            type="button"
            className="button-remove"
            onClick={() => arrayHelpers.remove(index)}
          >
            Remove
          </button>
        </div>
      </div>
    );
  };

  // Render modal form content for player/character
  const renderModalFormContent = formikProps => {
    const { values } = formikProps;
    const { isOpen, type, assignmentIndex } = modalConfig;
    if (!isOpen) return null;
    const current = values.assignments[assignmentIndex];
    if (type === 'player') {
      return (
        <>
          <h4>Add New Player Details</h4>
          <FormField
            label="Player Name"
            name={`assignments.${assignmentIndex}.player.name`}
            placeholder="Enter player's name"
          />
          <FormField
            label="Player Summary (Optional)"
            name={`assignments.${assignmentIndex}.player.summary`}
            as="textarea"
            placeholder="Brief summary"
          />
          <div className="modal-actions">
            <button
              type="button"
              className="button-primary"
              onClick={() => setModalConfig(prev => ({ ...prev, type: 'character' }))}
            >
              Next: Add Character
            </button>
            <button
              type="button"
              className="button"
              onClick={() => setModalConfig({ isOpen: false, type: null, assignmentIndex: null })}
            >
              Cancel
            </button>
          </div>
        </>
      );
    }
    return (
      <>
        <h4>
          Add Character Details for {current.player?.name || uniquePlayers.find(p => p.id === current.player_id)?.name}
        </h4>
        <FormField label="Character Name" name={`assignments.${assignmentIndex}.character.name`} placeholder="Character's name" />
        <FormField label="Class" name={`assignments.${assignmentIndex}.character.character_class`} placeholder="e.g., Warrior" />
        <FormField label="Level" name={`assignments.${assignmentIndex}.character.level`} type="number" placeholder="1" />
        <FormField label="Icon URL (Optional)" name={`assignments.${assignmentIndex}.character.icon`} type="url" placeholder="https://..." />
        <FormField label="Is Active" name={`assignments.${assignmentIndex}.character.is_active`} type="checkbox" />
        <div className="modal-actions">
          <button
            type="button"
            className="button-primary"
            onClick={() => setModalConfig({ isOpen: false, type: null, assignmentIndex: null })}
          >
            Save Character
          </button>
          <button
            type="button"
            className="button"
            onClick={() => setModalConfig({ isOpen: false, type: null, assignmentIndex: null })}
          >
            Cancel
          </button>
        </div>
      </>
    );
  };

  // Main form render helper
  const renderMainForm = formikProps => {
    const { isSubmitting, errors, values } = formikProps;
    return (
      <Form noValidate className="new-game-assignments-form">
        <h3>Game Details</h3>
        {errors.server && <div className="error-message server-error">{errors.server}</div>}
        <FormField label="Title" name="title" placeholder="Name of your game" />
        <FormField label="System" name="system" placeholder="e.g., D&D 5e" />
        <FormField label="Status" name="status" placeholder="e.g., Planning" />
        <FormField label="Description (Optional)" name="description" as="textarea" placeholder="Brief overview" />
        <FormField label="Setting (Optional)" name="setting" as="textarea" placeholder="Game world" />
        <FormField label="Start Date (Optional)" name="start_date" type="date" />

        <h3>Player Assignments</h3>
        <FieldArray name="assignments">
          {arrayHelpers => (
            <div className="assignments-section">
              {values.assignments?.map((a, idx) => renderAssignmentListItem(a, idx, arrayHelpers))}
              <div className="add-assignment-control">
                <select
                  value=""
                  onChange={e => handleAddAssignmentType(e, arrayHelpers)}
                  className="add-assignment-select"
                >
                  <option value="" disabled>Add Player Assignment...</option>
                  {uniquePlayers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  <option value="__new_player">+ Create New Player</option>
                </select>
              </div>
            </div>
          )}
        </FieldArray>

        <div className="form-actions main-form-actions">
          <button type="submit" disabled={isSubmitting} className="button-primary submit-button">
            {isSubmitting ? 'Creating Game...' : 'Create Game with Assignments'}
          </button>
        </div>

        <Modal
          isOpen={modalConfig.isOpen}
          onClose={() => setModalConfig({ isOpen: false, type: null, assignmentIndex: null })}
        >
          <div className="modal-form-content">
            {renderModalFormContent(formikProps)}
          </div>
        </Modal>
      </Form>
    );
  };

  return (
    <div className="new-game-with-assignments-container">
      <h2>Start a New Game with Player Assignments</h2>
      <Formik
        initialValues={initialGameFormValues}
        validationSchema={NewGameSchema}
        onSubmit={handleMainFormSubmit}
        enableReinitialize
      >
        {renderMainForm}
      </Formik>
    </div>
  );
}
