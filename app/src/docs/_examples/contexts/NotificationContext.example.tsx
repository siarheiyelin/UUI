import React, { ReactNode, useState } from 'react';
import {
    Panel,
    FlexRow,
    Button,
    Text,
    FlexSpacer,
    PickerInput,
    ModalHeader,
    LabeledInput,
    TextInput,
    WarningNotification,
    SuccessNotification,
    ErrorNotification,
    NotificationCard,
    RichTextView,
} from '@epam/uui';
import { ArrayDataSource, INotification, useUuiContext } from '@epam/uui-core';
import { FlexCell } from '@epam/uui-components';

export interface PositionType {
    direction: 'bot-left' | 'bot-right' | 'top-left' | 'top-right' | 'top-center' | 'bot-center';
}

export default function NotificationContextExample() {
    const { uuiNotifications } = useUuiContext();
    const [positionType, setPositionType] = useState<PositionType>({ direction: 'bot-left' });

    const handleSuccess = () => {
        uuiNotifications
            .show(
                (props: INotification) => (
                    <SuccessNotification { ...props }>
                        <Text size="36" fontSize="14">
                            Success notification
                        </Text>
                    </SuccessNotification>
                ),
                { position: positionType.direction, duration: 'forever' },
            )
            .catch(() => null);
    };

    const handleWarning = () => {
        uuiNotifications
            .show(
                (props: INotification) => (
                    <WarningNotification
                        { ...props }
                        actions={ [
                            {
                                name: 'Ok',
                                action: props.onSuccess,
                            }, {
                                name: 'Cancel',
                                action: props.onClose,
                            },
                        ] }
                    >
                        <Text size="36" fontSize="14">
                            Warning notification with some buttons
                        </Text>
                    </WarningNotification>
                ),
                { duration: 5, position: positionType.direction },
            )
            .then(() => {
                uuiNotifications
                    .show(
                        (props: INotification) => (
                            <SuccessNotification { ...props }>
                                <Text size="36" fontSize="14">
                                    It`s Ok!
                                </Text>
                            </SuccessNotification>
                        ),
                        { duration: 2, position: positionType.direction },
                    )
                    .catch(() => null);
            })
            .catch(() => null);
    };

    const handleError = () => {
        uuiNotifications
            .show(
                (props: INotification) => (
                    <ErrorNotification
                        { ...props }
                        actions={ [
                            {
                                name: 'Cancel',
                                action: props.onClose,
                            },
                        ] }
                    >
                        <Text size="36" fontSize="14">
                            Error notification with looooooooong looooooong text about lorem ispum dolor
                        </Text>
                    </ErrorNotification>
                ),
                { position: positionType.direction },
            )
            .catch(() => null);
    };

    const handleSnackWithRichText = () => {
        uuiNotifications
            .show(
                (props: INotification): ReactNode => (
                    <NotificationCard { ...props } color="info">
                        <RichTextView>
                            <h3>Title</h3>
                            <p>
                                <u>Some description</u>
                                . If you want,
                                <strong>you can</strong>
                                {' '}
                                redirect to
                                <a href="https://www.google.com/">Google</a>
                            </p>
                        </RichTextView>
                    </NotificationCard>
                ),
                { duration: 'forever', position: positionType.direction },
            )
            .catch(() => null);
    };

    const customNotificationHandler = () => {
        uuiNotifications
            .show(
                (props: INotification): ReactNode => (
                    <Panel style={ { width: '420px' } } shadow>
                        <ModalHeader title="Custom notification" onClose={ props.onClose } />
                        <FlexRow padding="24" spacing="12">
                            <LabeledInput size="36" label="Promotion Cycle">
                                <TextInput value="" size="36" onValueChange={ () => {} } />
                            </LabeledInput>
                        </FlexRow>
                        <FlexRow padding="24" spacing="12">
                            <LabeledInput size="36" label="Discipline">
                                <TextInput value="" size="36" onValueChange={ () => {} } />
                            </LabeledInput>
                        </FlexRow>
                        <FlexSpacer />
                        <FlexRow padding="24" vPadding="24" spacing="12">
                            <FlexSpacer />
                            <Button color="accent" onClick={ props.onClose } caption="Cancel" />
                            <Button color="accent" caption="Confirm" onClick={ props.onSuccess } />
                        </FlexRow>
                    </Panel>
                ),
                { position: positionType.direction, duration: 'forever' },
            )
            .then(handleSuccess)
            .catch(() => null);
    };

    return (
        <div>
            <FlexRow size="48" padding="12" spacing="12">
                <Button caption="Click" size="24" color="accent" fill="outline" onClick={ handleSuccess } />
                <Text size="36" fontWeight="600">
                    Simple notification
                </Text>
            </FlexRow>
            <FlexRow size="48" padding="12" spacing="12">
                <Button caption="Click" size="24" color="primary" fill="outline" onClick={ handleWarning } />
                <Text size="36" fontWeight="600">
                    Notification with additional buttons
                </Text>
            </FlexRow>
            <FlexRow size="48" padding="12" spacing="12">
                <Button caption="Click" size="24" color="critical" fill="outline" onClick={ handleError } />
                <Text size="36" fontWeight="600">
                    Huge notification with long title and several rows with buttons
                </Text>
            </FlexRow>
            <FlexRow size="48" padding="12" spacing="12">
                <Button caption="Click" size="24" color="accent" fill="outline" onClick={ customNotificationHandler } />
                <Text size="36" fontWeight="600">
                    All custom notification
                </Text>
            </FlexRow>
            <FlexRow size="48" padding="12" spacing="12">
                <Button caption="Click" size="24" color="secondary" fill="outline" onClick={ handleSnackWithRichText } />
                <Text size="36" fontWeight="600">
                    Notification with RichTextView
                </Text>
            </FlexRow>

            <FlexRow size="48" padding="12" spacing="12">
                <Text size="36" fontWeight="600">
                    Position of pop-up:
                </Text>
                <FlexCell width={ 200 }>
                    <PickerInput
                        onValueChange={ (newVal) => setPositionType({ direction: newVal }) }
                        dataSource={
                            new ArrayDataSource({
                                items: [
                                    'bot-left', 'top-left', 'bot-right', 'top-right', 'top-center', 'bot-center',
                                ].map((name) => ({ id: name, name })),
                            })
                        }
                        selectionMode="single"
                        valueType="id"
                        getName={ (val) => val.name }
                        value={ positionType.direction }
                        size="30"
                    />
                </FlexCell>
            </FlexRow>
        </div>
    );
}
