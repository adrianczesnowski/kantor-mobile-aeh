import { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Modal, Portal, Text, Button, TextInput } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { changePassword } from '@/services/auth.service';


interface Props {
    visible: boolean;
    onDismiss: () => void;
    onSuccess: () => void;
}

export default function ChangePasswordModal({ visible, onDismiss, onSuccess }: Props) {
    const { t } = useTranslation();
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');

    const passwordMutation = useMutation({
        mutationFn: changePassword,
        onSuccess: () => {
            setOldPassword('');
            setNewPassword('');
            onSuccess();
            onDismiss();
        },
        onError: (error: any) => {
            Alert.alert(t('settings.passwordErrorTitle'), t('settings.passwordError'));
        },
    });

    const handleChangePassword = () => {

        if (!oldPassword || !newPassword) {
            Alert.alert(t('common.error'), t('settings.passwordValidationEmpty'));
            return;
        }
        if (newPassword.length < 6) {
            Alert.alert(t('common.error'), t('settings.passwordValidationLength'));
            return;
        }

        passwordMutation.mutate({ oldPassword, newPassword });
    };

    return (
        <Portal>
            <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={styles.modalContainer}>
                <Text style={styles.modalTitle}>
                    {t('settings.changePasswordTitle')}
                </Text>

                <TextInput
                    label={t('settings.oldPassword')}
                    value={oldPassword}
                    onChangeText={setOldPassword}
                    secureTextEntry
                    mode="outlined"
                    style={styles.input}
                    activeOutlineColor="#5844ED"
                    placeholderTextColor="#99A2AD"
                />
                <TextInput
                    label={t('settings.newPassword')}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry
                    mode="outlined"
                    style={styles.input}
                    activeOutlineColor="#5844ED"
                    placeholderTextColor="#99A2AD"
                />

                <Button
                    mode="contained"
                    onPress={handleChangePassword}
                    loading={passwordMutation.isPending}
                    style={styles.button}
                    buttonColor="#5844ED"
                    labelStyle={styles.buttonLabel}
                    disabled={passwordMutation.isPending}
                >
                    {t('settings.changePasswordButton')}
                </Button>

                <Button
                    mode="text"
                    onPress={onDismiss}
                    disabled={passwordMutation.isPending}
                    labelStyle={styles.cancelButtonLabel}
                    style={styles.cancelButton}
                >
                    {t('common.cancel')}
                </Button>
            </Modal>
        </Portal>
    );
}

const styles = StyleSheet.create({
    modalContainer: {
        backgroundColor: '#FFFFFF',
        padding: 30,
        margin: 20,
        borderRadius: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 10,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#333333',
        marginBottom: 20,
        textAlign: 'center',
    },
    input: {
        marginBottom: 15,
        backgroundColor: '#F7F7F7',
    },
    button: {
        marginTop: 10,
        borderRadius: 10,
        height: 50,
        justifyContent: 'center',
    },
    buttonLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    cancelButton: {
        marginTop: 5,
    },
    cancelButtonLabel: {
        color: '#5844ED',
        fontWeight: '600',
    }
});
