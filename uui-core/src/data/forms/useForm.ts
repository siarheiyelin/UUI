import { useRef, useEffect, useMemo, useCallback } from 'react';
import {
    mergeValidation,
    validate as uuiValidate,
    validateServerErrorState,
} from '../../data/validation';
import { useForceUpdate } from '../../hooks';
import { UuiContexts } from '../../types/contexts';
import { ICanBeInvalid } from '../../types/props';
import { useUuiContext } from '../../services';
import { LensBuilder } from '../lenses/LensBuilder';
import isEqual from 'lodash.isequal';
import { FormProps, FormSaveResponse, IFormApi } from './Form';
import { useLock } from './useLock';
import { shouldCreateUndoCheckpoint } from './shouldCreateUndoCheckpoint';

interface FormState<T> {
    form: T;
    validationState: ICanBeInvalid;
    serverValidationState: ICanBeInvalid;
    lastSentForm?: T;
    isChanged: boolean;
    formHistory: T[];
    historyIndex: number;
    isInProgress: boolean;
    isInSaveMode: boolean;
}

export type UseFormProps<T> = Omit<FormProps<T>, 'renderForm'>;

export function useForm<T>(props: UseFormProps<T>): IFormApi<T> {
    const context: UuiContexts = useUuiContext();

    const initialForm = useRef<FormState<T>>({
        isChanged: false,
        isInProgress: false,
        form: props.value,
        validationState: { isInvalid: false },
        serverValidationState: { isInvalid: false },
        formHistory: [props.value],
        historyIndex: 0,
        isInSaveMode: false,
    });

    const propsRef = useRef(props);
    propsRef.current = props;

    const getMetadata = (value: T) =>
        propsRef.current.getMetadata ? propsRef.current.getMetadata(value) : {};

    const prevFormValue = useRef<T>(props.value);

    const formState = useRef(initialForm.current);

    const forceUpdate = useForceUpdate();

    const updateFormState = (
        update: (current: FormState<T>) => FormState<T>,
    ) => {
        const newState = update(formState.current);
        formState.current = newState;
        forceUpdate();
    };

    const handleSave = useCallback((isSavedBeforeLeave?: boolean) => {
        let savePromise: any;
        updateFormState((currentState) => {
            let newState = { ...currentState, isInSaveMode: true };
            newState.isInSaveMode = true;
            newState = updateValidationStates(newState);
            if (!newState.validationState.isInvalid) {
                newState.isInProgress = true;
                savePromise = propsRef.current
                    .onSave(formState.current.form)
                    .then((response) =>
                        handleSaveResponse(response, isSavedBeforeLeave))
                    .catch((err) => handleError(err));
            } else {
                savePromise = Promise.reject();
            }
            return newState;
        });
        return savePromise;
    }, []);

    const removeUnsavedChanges = useCallback(() => {
        context.uuiUserSettings.set(props.settingsKey, null);
    }, [context.uuiUserSettings, props.settingsKey]);

    const handleLeave = useCallback(() => {
        if (props.beforeLeave) {
            return props.beforeLeave().then((res) => {
                if (res) return handleSave(true);
                removeUnsavedChanges();
            });
        }
        return null;
    }, [
        props.beforeLeave,
        handleSave,
        removeUnsavedChanges,
    ]);

    const isLockEnabled = formState.current.isChanged;
    useLock({
        isEnabled: isLockEnabled,
        handleLeave,
    });

    const lens = useMemo(
        () =>
            new LensBuilder<T, T>({
                get: () => formState.current.form,
                set: (_, small: T) => {
                    handleFormUpdate(() => small);
                    return small;
                },
                getValidationState: () => {
                    const {
                        form, lastSentForm, serverValidationState, validationState,
                    } = formState.current;
                    const serverValidation = validateServerErrorState(form, lastSentForm, serverValidationState);
                    return mergeValidation(validationState, serverValidation);
                },
                getMetadata: () => getMetadata(formState.current.form),
            }),
        [],
    );

    useEffect(() => {
        const unsavedChanges = getUnsavedChanges();
        if (!unsavedChanges || !props.loadUnsavedChanges || isEqual(unsavedChanges, initialForm.current.form)) return;
        props
            .loadUnsavedChanges()
            .then(() => handleFormUpdate(() => unsavedChanges))
            .catch(() => null);
    }, []);

    useEffect(() => {
        if (!isEqual(props.value, prevFormValue.current)) {
            resetForm({
                ...formState.current,
                form: props.value,
                formHistory: formState.current.isChanged ? formState.current.formHistory : [props.value],
            });
            prevFormValue.current = props.value;
        }
    }, [props.value]);

    const getUnsavedChanges = (): T => {
        return context.uuiUserSettings.get<T>(props.settingsKey);
    };
    //
    // const getChangedState = (newVal: T, initialVal: T): ICanBeChanged => {
    //     const getValueChangedState = (value: any, initialVal: any): ICanBeChanged => {
    //         const result: any = {};
    //         Object.keys(value).map(key => {
    //             const itemValue = value[key];
    //             const initialItemValue = initialVal && initialVal[key];
    //             const isChanged = itemValue !== initialItemValue;
    //             result[key] = {
    //                 isChanged,
    //             };
    //             if (itemValue && typeof itemValue === 'object') {
    //                 result[key].changedProps = getValueChangedState(value[key], initialItemValue);
    //             }
    //         });
    //         return result;
    //     };
    //     return getValueChangedState(newVal, initialVal);
    // };

    const handleFormUpdate = (update: (current: T) => T, options?: { addCheckpoint?: boolean }) =>
        updateFormState((currentState) => {
            options = options ?? {};
            options.addCheckpoint = options.addCheckpoint ?? true;

            const newForm = update(currentState.form);
            let { historyIndex, formHistory } = currentState;

            // Determine if change is significant and we need to create new checkpoint.
            // If false - we'll just update the latest checkpoint.
            // We need to always create a checkpoint at the first change, to save initial form state.
            const needCheckpoint = historyIndex === 0 || shouldCreateUndoCheckpoint(formHistory[historyIndex - 1], formHistory[historyIndex], newForm);

            if (options.addCheckpoint && needCheckpoint) {
                historyIndex++;
            }
            formHistory = formHistory.slice(0, historyIndex).concat(newForm);

            if (options.addCheckpoint || context.uuiUserSettings.get(props.settingsKey)) {
                context.uuiUserSettings.set(props.settingsKey, newForm);
            }

            const isChanged = !isEqual(initialForm.current.form, newForm);

            let newState = {
                ...currentState,
                form: newForm,
                isChanged: isChanged,
                historyIndex,
                formHistory,
            };

            if (currentState.isInSaveMode || props.validationOn === 'change') {
                newState = updateValidationStates(newState);
            }

            return newState;
        });

    const resetForm = (withNewState: FormState<T>) =>
        updateFormState((currentState) => {
            const newFormState = { ...currentState, ...withNewState };
            if (newFormState !== currentState) {
                initialForm.current = newFormState;
                return newFormState;
            }
        });

    const updateValidationStates = (state: FormState<T>): FormState<T> => {
        const valueToValidate = state.form;
        const metadata = getMetadata(valueToValidate);
        const isInSaveMode = state.isInSaveMode;
        const validationMode = isInSaveMode || !props.validationOn ? 'save' : props.validationOn;
        const validationState = uuiValidate(valueToValidate, metadata, initialForm.current.form, validationMode);

        const newState = { ...state, validationState };

        if (!validationState.isInvalid) {
            // When form became valid, we switch inSaveMode to false
            newState.isInSaveMode = false;
        }
        return newState;
    };

    const handleError = (err?: any) => {
        updateFormState((currentValue) => ({
            ...currentValue,
            isInProgress: false,
        }));

        propsRef.current.onError?.(err);
    };

    const handleSaveResponse = (response: FormSaveResponse<T> | void, isSavedBeforeLeave?: boolean) => {
        const newFormValue = (response && response.form) || formState.current.form;
        const newState: FormState<T> = {
            ...formState.current,
            historyIndex: 0,
            formHistory: [newFormValue],
            isChanged: response && response.validation?.isInvalid ? formState.current.isChanged : false,
            form: newFormValue,
            isInProgress: false,
            serverValidationState: (response && response.validation) || formState.current.serverValidationState,
            lastSentForm: response && response.validation?.isInvalid ? response.form || formState.current.form : formState.current.lastSentForm,
        };

        if (response && response.validation) {
            updateFormState(() => newState);
            return;
        }

        resetForm(newState);
        removeUnsavedChanges();

        if (propsRef.current.onSuccess && response) {
            propsRef.current.onSuccess(response.form, isSavedBeforeLeave);
        }
    };

    const handleUndo = useCallback(
        () =>
            updateFormState((currentState) => {
                const { formHistory, historyIndex } = currentState;
                const previousIndex = historyIndex - 1;

                if (previousIndex >= 0) {
                    const previousItem = formHistory[previousIndex];
                    let newState = {
                        ...currentState,
                        isChanged: previousIndex !== 0,
                        form: previousItem,
                        historyIndex: previousIndex,
                    };
                    if (currentState.validationState.isInvalid) {
                        newState = updateValidationStates(newState);
                    }
                    return newState;
                } else {
                    return currentState;
                }
            }),
        [],
    );

    const handleRedo = useCallback(
        () =>
            updateFormState((currentState) => {
                const { formHistory, historyIndex } = currentState;
                const nextIndex = historyIndex + 1;
                if (nextIndex < currentState.formHistory.length) {
                    const nextItem = formHistory[nextIndex];
                    let newState = {
                        ...currentState, form: nextItem, historyIndex: nextIndex, isChanged: true,
                    };
                    if (currentState.validationState.isInvalid) {
                        newState = updateValidationStates(newState);
                    }
                    return newState;
                } else {
                    return currentState;
                }
            }),
        [],
    );

    const validate = useCallback(() => {
        const formSate = { ...formState.current, isInSaveMode: true };
        const newState = updateValidationStates(formSate);
        updateFormState(() => newState);

        return newState.validationState;
    }, []);

    const handleRevert = useCallback(() => {
        resetForm(initialForm.current);
    }, [props.value]);

    const handleValueChange = useCallback((newValue: T) => {
        handleFormUpdate(() => newValue);
    }, []);

    const handleSetValue = useCallback((value: React.SetStateAction<T>) => {
        handleFormUpdate((currentValue) => {
            const newValue: T = value instanceof Function ? value(currentValue) : value;
            return newValue;
        });
    }, []);

    const handleReplaceValue = useCallback((value: React.SetStateAction<T>) => {
        updateFormState((currentValue) => {
            const newFormValue = value instanceof Function ? value(currentValue.form) : value;
            return {
                ...currentValue,
                form: newFormValue,
            };
        });
    }, []);

    const saveCallback = useCallback(() => {
        handleSave().catch(() => {});
    }, [handleSave]);

    const handleClose = useCallback(() => {
        return isLockEnabled ? handleLeave() : Promise.resolve();
    }, [isLockEnabled]);

    return {
        setValue: handleSetValue,
        replaceValue: handleReplaceValue,
        isChanged: formState.current.isChanged,
        close: handleClose,
        lens,
        save: saveCallback,
        undo: handleUndo,
        redo: handleRedo,
        revert: handleRevert,
        validate,
        canUndo: formState.current.historyIndex > 0,
        canRedo: formState.current.historyIndex < formState.current.formHistory.length - 1,
        canRevert: formState.current.form !== props.value,
        value: formState.current.form,
        onValueChange: handleValueChange,
        isInvalid: formState.current.validationState.isInvalid,
        validationMessage: formState.current.validationState.validationMessage,
        validationProps: formState.current.validationState.validationProps,
        isInProgress: formState.current.isInProgress,
    };
}
