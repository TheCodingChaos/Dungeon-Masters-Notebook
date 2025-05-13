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

    return (
        <Formik
            initialValues={{
                title: '',
                system: '',
                status: '',
                description: '',
                setting: '',
                start_date: '',
                assignments: [],
            }}
            validationSchema={NewGameSchema}
            onSubmit={async function (values, formikHelpers) {
                var setSubmitting = formikHelpers.setSubmitting;
                var resetForm = formikHelpers.resetForm;
                var setFieldError = formikHelpers.setFieldError;
                // Manual validation of assignments
                for (let idx = 0; idx < values.assignments.length; idx++) {
                    const a = values.assignments[idx];
                    // skip empty rows
                    if (!(a.player_id || (a.player && a.player.name))) continue;
                    if (a.player_id) {
                        // existing player: must have character name
                        if (!a.character.name) {
                            setFieldError(`assignments.${idx}.character.name`, 'Required');
                            return;
                        }
                    } else {
                        // new player: must have player name and character name
                        if (!a.player || !a.player.name) {
                            setFieldError(`assignments.${idx}.player.name`, 'Required');
                            return;
                        }
                        if (!a.character.name) {
                            setFieldError(`assignments.${idx}.character.name`, 'Required');
                            return;
                        }
                    }
                }
                try {
                    // Remove assignments without player and character
                    const filtered = values.assignments.filter(a =>
                        ((a.player_id) || (a.player && a.player.name)) && a.character && a.character.name
                    );
                    const payload = { ...values, assignments: filtered };

                    var newGame = await callApi('/games', {
                        method: 'POST',
                        body: JSON.stringify(payload),
                    });
                    resetForm();
                    if (onSuccess) {
                        onSuccess(newGame);
                    }
                } catch (err) {
                    console.error(err);
                } finally {
                    setSubmitting(false);
                }
            }}
        >
            {function (formikProps) {
                const values = formikProps.values;
                const isSubmitting = formikProps.isSubmitting;
                const setFieldError = formikProps.setFieldError;
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
                                {function (arrayHelpers) {
                                    return (
                                        <div>
                                            {/* List only completed assignments */}
                                            {values.assignments.map(function (assign, i) {
                                                if (!assign.character || !assign.character.name) return null;
                                                // Determine display name
                                                var playerName = assign.player_id
                                                    ? ((uniquePlayers.find(function (p) { return p.id === assign.player_id; }) || {}).name)
                                                    : assign.player && assign.player.name;
                                                return (
                                                    <div key={i} style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                                                        <span>{playerName} / {assign.character.name}</span>
                                                        <button
                                                            type="button"
                                                            onClick={function () {
                                                                // If new player, reopen player modal first
                                                                if (assign.player) {
                                                                    setModalConfig({ open: true, type: 'player', index: i });
                                                                } else {
                                                                    setModalConfig({ open: true, type: 'character', index: i });
                                                                }
                                                            }}
                                                            style={{ marginLeft: '8px' }}
                                                        >Edit</button>
                                                        <button
                                                            type="button"
                                                            onClick={function () { arrayHelpers.remove(i); }}
                                                            style={{ marginLeft: '4px' }}
                                                        >Remove</button>
                                                    </div>
                                                );
                                            })}

                                            {/* Single dropdown to add new assignment */}
                                            <select
                                                value=""
                                                onChange={function (e) {
                                                    const val = e.target.value;
                                                    if (!val) return;
                                                    let newAssign = getDefaultAssignment();
                                                    if (val === 'new') {
                                                        delete newAssign.player_id;
                                                        newAssign.player = { name: '', summary: '' };
                                                        arrayHelpers.push(newAssign);
                                                        setModalConfig({ open: true, type: 'player', index: values.assignments.length });
                                                    } else {
                                                        newAssign.player_id = Number(val);
                                                        arrayHelpers.push(newAssign);
                                                        setModalConfig({ open: true, type: 'character', index: values.assignments.length });
                                                    }
                                                }}
                                            >
                                                <option value="" disabled>Add a player...</option>
                                                {uniquePlayers.map(function (p) {
                                                    return <option key={p.id} value={p.id}>{p.name}</option>;
                                                })}
                                                <option value="new">+ New Player...</option>
                                            </select>
                                        </div>
                                    );
                                }}
                            </FieldArray>

                            <button type="submit" disabled={isSubmitting}>Create Game</button>
                        </Form>

                        {/* Modal for inline new player or character */}
                        <Modal
                            isOpen={modalConfig.open}
                            onClose={function () { setModalConfig({ open: false, type: null, index: null }); }}
                        >
                            {modalConfig.type === 'player' ? (
                                <div>
                                    <FormField label="Player Name" name={`assignments.${modalConfig.index}.player.name`} />
                                    <FormField label="Summary" name={`assignments.${modalConfig.index}.player.summary`} as="textarea" />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            // Validate new player name before advancing
                                            const playerName = (values.assignments[modalConfig.index].player || {}).name || '';
                                            if (!playerName.trim()) {
                                                setFieldError(
                                                    `assignments.${modalConfig.index}.player.name`,
                                                    'Required'
                                                );
                                                return;
                                            }
                                            setModalConfig({ open: true, type: 'character', index: modalConfig.index });
                                        }}
                                    >
                                        Next: Character
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setModalConfig({ open: false, type: null, index: null })}
                                      style={{ marginLeft: '8px' }}
                                    >
                                      Cancel
                                    </button>
                                </div>
                            ) : (
                                <div>
                                    <FormField label="Character Name" name={`assignments.${modalConfig.index}.character.name`} />
                                    <FormField label="Class" name={`assignments.${modalConfig.index}.character.character_class`} />
                                    <FormField label="Level" name={`assignments.${modalConfig.index}.character.level`} type="number" />
                                    <FormField label="Icon URL" name={`assignments.${modalConfig.index}.character.icon`} />
                                    <FormField label="Active" name={`assignments.${modalConfig.index}.character.is_active`} type="checkbox" />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            // Validate character fields before closing
                                            const char = values.assignments[modalConfig.index].character || {};
                                            if (!char.name || !char.name.trim()) {
                                                setFieldError(
                                                    `assignments.${modalConfig.index}.character.name`,
                                                    'Required'
                                                );
                                                return;
                                            }
                                            if (!char.character_class || !char.character_class.trim()) {
                                                setFieldError(
                                                    `assignments.${modalConfig.index}.character.character_class`,
                                                    'Required'
                                                );
                                                return;
                                            }
                                            setModalConfig({ open: false, type: null, index: null });
                                        }}
                                    >
                                        Save Character
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setModalConfig({ open: false, type: null, index: null })}
                                      style={{ marginLeft: '8px' }}
                                    >
                                      Cancel
                                    </button>
                                </div>
                            )}
                        </Modal>
                    </div>
                );
            }}
        </Formik>
    );
}