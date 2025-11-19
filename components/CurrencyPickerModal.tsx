import { AppCurrency, SUPPORTED_CURRENCIES } from '@/constants/currencies';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    FlatList,
    Keyboard,
    Modal,
    Pressable,
    StyleSheet,
    TextInput,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import { IconButton, Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface CurrencyPickerModalProps {
    isVisible: boolean;
    onClose: () => void;
    onSelect: (currency: AppCurrency) => void;
    currentCode: string;
}

export const CurrencyPickerModal = ({
    isVisible,
    onClose,
    onSelect,
    currentCode,
}: CurrencyPickerModalProps) => {
    const insets = useSafeAreaInsets();
    const { t } = useTranslation();
    const [filter, setFilter] = useState('');

    const filteredCurrencies = useMemo(() => {
        if (!filter) return SUPPORTED_CURRENCIES;
        const lowerFilter = filter.toLowerCase();

        return SUPPORTED_CURRENCIES.filter((c) => {
            const codeMatch = c.code.toLowerCase().includes(lowerFilter);
            const nameMatch = t(c.nameKey).toLowerCase().includes(lowerFilter);
            return codeMatch || nameMatch;
        });
    }, [filter, t]);

    const handleSelect = (item: AppCurrency) => {
        onSelect(item);
        onClose();
    };

    const renderItem = ({ item }: { item: AppCurrency }) => {
        const isSelected = item.code === currentCode;
        return (
            <Pressable
                style={({ pressed }) => [styles.item, { opacity: pressed ? 0.7 : 1 }]}
                onPress={() => handleSelect(item)}
            >
                <Text style={styles.itemFlag}>{item.flag}</Text>
                <View style={styles.itemInfo}>
                    <Text style={styles.itemCode}>{item.code}</Text>
                    <Text style={styles.itemName}>{t(item.nameKey)}</Text>
                </View>
                {isSelected && (
                    <View style={styles.checkIconCircle}>
                        <Text style={styles.checkIcon}>✓</Text>
                    </View>
                )}
            </Pressable>
        );
    };

    return (
        <Modal
            visible={isVisible}
            animationType="slide"
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                <View style={{ ...styles.container, paddingTop: insets.top }}>
                    <View style={styles.header}>
                        <Text variant="headlineLarge" style={styles.title}>
                            {t('currencyPicker.title')}
                        </Text>
                        <IconButton
                            icon="close"
                            size={24}
                            onPress={onClose}
                            style={styles.closeButton}
                        />
                    </View>

                    <View style={styles.searchContainer}>
                        <TextInput
                            style={styles.searchInput}
                            value={filter}
                            onChangeText={setFilter}
                            placeholder={t('currencyPicker.searchPlaceholder')}
                            placeholderTextColor="#99A2AD"
                            selectionColor="#5844ED"
                        />
                    </View>

                    <FlatList
                        data={filteredCurrencies}
                        keyExtractor={(item) => item.code}
                        renderItem={renderItem}
                        ItemSeparatorComponent={() => <View style={styles.separator} />}
                        ListEmptyComponent={
                            <View style={styles.center}>
                                <Text style={styles.emptyText}>{t('currencyPicker.empty')}</Text>
                            </View>
                        }
                        keyboardShouldPersistTaps="handled"
                        contentContainerStyle={{ paddingBottom: 20 }}
                    />
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 10,
        position: 'relative',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    title: {
        fontSize: 24,
        fontWeight: '600',
        color: '#333333',
        textAlign: 'center',
    },
    closeButton: {
        position: 'absolute',
        right: 10,
        top: '50%',
        transform: [{ translateY: -10 }],
    },
    searchContainer: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    searchInput: {
        height: 45,
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        paddingHorizontal: 15,
        fontSize: 16,
        color: '#333333',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    item: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },
    itemFlag: {
        fontSize: 28,
        marginRight: 15,
    },
    itemInfo: {
        flex: 1,
    },
    itemCode: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333333',
    },
    itemName: {
        fontSize: 13,
        color: '#99A2AD',
    },
    separator: {
        height: 1,
        backgroundColor: '#F5F7FA',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    emptyText: {
        fontSize: 16,
        color: '#99A2AD',
    },
    checkIconCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#5844ED',
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkIcon: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: 'bold',
    },
});