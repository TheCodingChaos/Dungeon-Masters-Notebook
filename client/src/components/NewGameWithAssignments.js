import React, { useContext, useState } from 'react';
import { Formik, Form, FieldArray } from 'formik';
import * as Yup from 'yup';
import FormField from './FormField';
import Modal from './Modal';
import callApi from '../utils/CallApi';
import { SessionContext } from '../contexts/SessionContext';


// Returns a fresh assignment object
function getDefaultAssignment() {
    return {
        player_id: '',
        player: null,
        character: {
            name: '',
            character_class: '',
            level: 1,
            icon: '',
            is_active: false,
        },
    };
}

// Validation for Game metadata + assignments
const NewGameSchema = Yup.object({
    title: Yup.string().required('Required'),
    system: Yup.string().required('Required'),
    status: Yup.string().required('Required'),
    description: Yup.string(),
    setting: Yup.string(),
    start_date: Yup.date().nullable(),
    assignments: Yup.array(),
});

export default function NewGameWithAssignments(props) {
    const onSuccess = props.onSuccess;
    const context = useContext(SessionContext);
    const sessionData = context.sessionData;

    let allPlayers = [];
    // Include any top-level players (unattached)
    if (sessionData.user && sessionData.user.players) {
        for (let p of sessionData.user.players) {
            allPlayers.push(p);
        }
    }
    // Include players from each game
    if (sessionData.user && sessionData.user.games) {
        for (let g of sessionData.user.games) {
            if (g.players) {
                for (let p of g.players) {
                    allPlayers.push(p);
                }
            }
        }
    }
    const seen = {};
    const uniquePlayers = allPlayers.filter(p => {
        if (!seen[p.id]) { seen[p.id] = true; return true; }
        return false;
    });

    const [modalConfig, setModalConfig] = useState({ open: false, type: null, index: null });

    // Initial form values
    const initialFormValues = {
      title: '',
      system: '',
      status: '',
      description: '',
      setting: '',
      start_date: '',
      assignments: [],
    };

    // Form submission handler
    const handleSubmit = async (values, { setSubmitting, resetForm, setFieldError }) => {
      // Manual validation of assignments
      for (let idx = 0; idx < values.assignments.length; idx++) {
        const a = values.assignments[idx];
        if (!(a.player_id || (a.player && a.player.name))) continue;
        if (a.player_id) {
          if (!a.character.name) {
            setFieldError(`assignments.${idx}.character.name`, 'Required');
            setSubmitting(false);
            return;
          }
        } else {
          if (!a.player?.name) {
            setFieldError(`assignments.${idx}.player.name`, 'Required');
            setSubmitting(false);
            return;
          }
          if (!a.character.name) {
            setFieldError(`assignments.${idx}.character.name`, 'Required');
            setSubmitting(false);
            return;
          }
        }
      }
      try {
        const filtered = values.assignments.filter(a =>
          (a.player_id || a.player?.name) && a.character?.name
        );
        const payload = { ...values, assignments: filtered };
        const newGame = await callApi('/games', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        resetForm();
        if (onSuccess) onSuccess(newGame);
      } catch (err) {
        console.error(err);
      } finally {
        setSubmitting(false);
      }
    };

    // Add assignment from dropdown
    const handleAddAssignment = (e, arrayHelpers) => {
      const val = e.target.value;
      if (!val) return;
      let newAssign = getDefaultAssignment();
      if (val === 'new') {
        delete newAssign.player_id;
        newAssign.player = { name: '', summary: '' };
        arrayHelpers.push(newAssign);
        setModalConfig({ open: true, type: 'player', index: arrayHelpers.form.values.assignments.length });
      } else {
        newAssign.player_id = Number(val);
        arrayHelpers.push(newAssign);
        setModalConfig({ open: true, type: 'character', index: arrayHelpers.form.values.assignments.length });
      }
    };

    // Render assignment list items
    const renderAssignmentItem = (assign, i, arrayHelpers) => {
      if (!assign.character?.name) return null;
      const playerName = assign.player_id
        ? (uniquePlayers.find(p => p.id === assign.player_id)?.name)
        : assign.player?.name;
      return (
        <div key={i} style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
          <span>{playerName} / {assign.character.name}</span>
          <button
            type="button"
            onClick={() => setModalConfig({ open: true, type: assign.player ? 'player' : 'character', index: i })}
            style={{ marginLeft: '8px' }}
          >Edit</button>
          <button
            type="button"
            onClick={() => arrayHelpers.remove(i)}
            style={{ marginLeft: '4px' }}
          >Remove</button>
        </div>
      );
    };

    // Render modal content
    const renderModalContent = (formikProps) => {
      const { setFieldError } = formikProps;
      const { type, index } = modalConfig;
      if (type === 'player') {
        return (
          <>
            <FormField label="Player Name" name={`assignments.${index}.player.name`} />
            <FormField label="Summary" name={`assignments.${index}.player.summary`} as="textarea" />
            <button type="button" onClick={() => {
              const name = formikProps.values.assignments[index].player?.name?.trim();
              if (!name) {
                setFieldError(`assignments.${index}.player.name`, 'Required');
                return;
              }
              setModalConfig({ open: true, type: 'character', index });
            }}>Next: Character</button>
            <button type="button" onClick={() => setModalConfig({ open: false, type: null, index: null })} style={{ marginLeft: '8px' }}>Cancel</button>
          </>
        );
      } else {
        return (
          <>
            <FormField label="Character Name" name={`assignments.${index}.character.name`} />
            <FormField label="Class" name={`assignments.${index}.character.character_class`} />
            <FormField label="Level" name={`assignments.${index}.character.level`} type="number" />
            <FormField label="Icon URL" name={`assignments.${index}.character.icon`} />
            <FormField label="Active" name={`assignments.${index}.character.is_active`} type="checkbox" />
            <button type="button" onClick={() => {
              const char = formikProps.values.assignments[index].character;
              if (!char.name?.trim()) {
                setFieldError(`assignments.${index}.character.name`, 'Required');
                return;
              }
              if (!char.character_class?.trim()) {
                setFieldError(`assignments.${index}.character.character_class`, 'Required');
                return;
              }
              setModalConfig({ open: false, type: null, index: null });
            }}>Save Character</button>
            <button type="button" onClick={() => setModalConfig({ open: false, type: null, index: null })} style={{ marginLeft: '8px' }}>Cancel</button>
          </>
        );
      }
    };

    return (
        <Formik
            initialValues={initialFormValues}
            validationSchema={NewGameSchema}
            onSubmit={handleSubmit}
        >
            {function (formikProps) {
                const isSubmitting = formikProps.isSubmitting;
                return (
                    <div>
                        <Form>
                            {/* Game fields */}
                            <FormField label="Title" name="title" />
                            <FormField label="System" name="system" />
                            <FormField label="Status" name="status" />
                            <FormField label="Description" name="description" as="textarea" />
                            <FormField label="Setting" name="setting" as="textarea" />
                            <FormField label="Start Date" name="start_date" type="date" />

                            {/* Assignments section */}
                            <FieldArray name="assignments">
                              {(arrayHelpers) => (
                                <div>
                                  {/* Existing assignments */}
                                  {arrayHelpers.form.values.assignments.map((assign, i) =>
                                    renderAssignmentItem(assign, i, arrayHelpers)
                                  )}
                                  {/* Dropdown to add */}
                                  <select value="" onChange={(e) => handleAddAssignment(e, arrayHelpers)}>
                                    <option value="" disabled>Add a player...</option>
                                    {uniquePlayers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    <option value="new">+ New Player...</option>
                                  </select>
                                </div>
                              )}
                            </FieldArray>

                            <button type="submit" disabled={isSubmitting}>Create Game</button>
                        </Form>

                        {/* Modal for inline new player or character */}
                        <Modal isOpen={modalConfig.open} onClose={() => setModalConfig({ open: false, type: null, index: null })}>
                          {renderModalContent(formikProps)}
                        </Modal>
                    </div>
                );
            }}
        </Formik>
    );
}