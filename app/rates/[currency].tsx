import {
    StyleSheet,
    View,
    ScrollView,
    ActivityIndicator,
    Alert,
    FlatList,
    TouchableOpacity,
} from 'react-native';
import { Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import React, { useMemo } from 'react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { MaterialIcons } from '@expo/vector-icons';
import { getCurrencyHistory, IHistoryRate } from '@/services/rates.service';
import { getCurrencyFlag } from '@/constants/currencies';
import { LineChart } from 'react-native-gifted-charts';

const HistoryItem = ({ item }: { item: IHistoryRate }) => {
    const formattedDate = format(new Date(item.effectiveDate), 'dd-MM-yyyy', { locale: pl });
    return (
        <View style={styles.historyItem}>
            <Text style={styles.historyDate}>{formattedDate}</Text>
            <Text style={styles.historyMid}>{item.mid.toFixed(4)} PLN</Text>
        </View>
    );
};

const CHART_POINT_SPACING = 25;
const CHART_SECTIONS = 5; 
const TOOLTIP_WIDTH = 120;
const TOOLTIP_HEIGHT = 50;

export default function CurrencyHistoryScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { t } = useTranslation();

    const { currency, name, latestMid, flag } = useLocalSearchParams<{
        currency: string;
        name: string;
        latestMid: string;
        flag?: string;
    }>();

    Stack.Screen({
        options: {
            headerShown: true,
            headerTransparent: true,
            headerTitle: '',
            headerLeft: () => (
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <MaterialIcons name="arrow-back" size={24} color="#333333" />
                </TouchableOpacity>
            ),
        },
    });

    const { data: history, isLoading, error } = useQuery({
        queryKey: ['currencyHistory', currency],
        queryFn: () => getCurrencyHistory(currency!),
        enabled: !!currency,
    });

    const currentRate = (history && history.length > 0)
        ? history[history.length - 1].mid.toFixed(4)
        : (latestMid ? parseFloat(latestMid).toFixed(4) : 'Brak danych');

    const displayHistory = useMemo(() => {
        if (!history || history.length < 2) return [];
        const historicalItems = history.slice(0, -1);
        return historicalItems.reverse();
    }, [history]);

    const chartData = useMemo(() => {
        if (!history || history.length < 2) return [];

        return history.map((item, index) => {
            const dateLabel = format(new Date(item.effectiveDate), 'dd.MM', { locale: pl });
            const showLabel = (index % 4 === 0) || (index === history.length - 1);

            return {
                value: item.mid,
                label: showLabel ? dateLabel : '',
                date: item.effectiveDate,
            };
        });
    }, [history, pl]);

    const chartConfig = useMemo(() => {
        if (!chartData || chartData.length < 2) {
            return { yAxisOffset: 0, stepValue: 0.2, noOfSections: CHART_SECTIONS };
        }

        const values = chartData.map(d => d.value);
        const minValue = Math.min(...values);
        const maxValue = Math.max(...values);
        const delta = maxValue - minValue;

        const padding = delta === 0 ? (minValue * 0.05) : (delta * 0.25);

        const newMin = Math.max(0, minValue - padding);
        const newMax = maxValue + padding;
        const newDelta = newMax - newMin;

        return {
            yAxisOffset: newMin,
            stepValue: newDelta / CHART_SECTIONS,
            noOfSections: CHART_SECTIONS
        };

    }, [chartData]);


    if (error) {
        Alert.alert(t('common.error', 'Wystąpił błąd'), error.message);
    }

    const currencyName = name || t('rates.unknownCurrency', 'Nieznana waluta');
    const displayFlag = flag || getCurrencyFlag(currency);

    const chartWidth = chartData.length * CHART_POINT_SPACING;

    if (isLoading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#5844ED" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView
                contentContainerStyle={[
                    styles.scrollContainer,
                    { paddingTop: insets.top + 60 }
                ]}
            >
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryFlag}>{displayFlag}</Text>
                    <Text style={styles.summaryCode}>{currency}</Text>
                    <Text style={styles.summaryName}>{currencyName}</Text>
                    <Text style={styles.summaryRate}>
                        1 {currency} = {currentRate} PLN
                    </Text>
                </View>

                <Text style={styles.groupTitle}>{t('rates.chartTitle', 'Wykres (30 dni)')}</Text>

                <View style={styles.chartContainer}>
                    {chartData.length > 0 ? (
                        <ScrollView horizontal={true} showsHorizontalScrollIndicator={false}>
                            <LineChart
                                width={chartWidth}
                                height={150}
                                data={chartData}
                                color="#5844ED"
                                thickness={3}
                                areaChart={false}
                                rulesType="dashed"
                                rulesColor="#E0E0E0"
                                noOfSections={chartConfig.noOfSections}
                                yAxisOffset={chartConfig.yAxisOffset}
                                stepValue={chartConfig.stepValue}
                                yAxisLabelWidth={50}
                                yAxisTextStyle={styles.yAxisLabel}
                                xAxisLabelTextStyle={styles.xAxisLabel}
                                spacing={CHART_POINT_SPACING}
                                initialSpacing={10}
                                dataPointsColor="#5844ED"
                                dataPointsRadius={4}
                                pointerConfig={{
                                    pointerStripHeight: 150,
                                    pointerStripColor: 'rgba(0,0,0,0.4)',
                                    pointerStripWidth: 2,
                                    pointerColor: '#5844ED',
                                    radius: 6,
                                    activatePointersOnLongPress: true,
                                    autoAdjustPointerLabelPosition: true,
                                    pointerLabelWidth: TOOLTIP_WIDTH,
                                    pointerLabelHeight: TOOLTIP_HEIGHT,
                                    pointerLabelComponent: (items: any[]) => (
                                        <View style={styles.tooltip}>
                                            <Text style={styles.tooltipDate}>
                                                {format(new Date(items[0].date), 'dd MMM yyyy', { locale: pl })}
                                            </Text>
                                            <Text style={styles.tooltipValue}>
                                                {items[0].value.toFixed(4)} PLN
                                            </Text>
                                        </View>
                                    )
                                }}
                            />
                        </ScrollView>
                    ) : (
                        <Text style={styles.chartPlaceholder}>
                            {t('rates.chartPlaceholder', 'Brak danych do narysowania wykresu')}
                        </Text>
                    )}
                </View>

                <Text style={styles.groupTitle}>{t('rates.historyListTitle', 'Historia dni')}</Text>
                <View style={styles.historyGroup}>
                    <FlatList
                        data={displayHistory}
                        keyExtractor={(item) => item.no}
                        renderItem={({ item }) => <HistoryItem item={item} />}
                        ItemSeparatorComponent={() => <View style={styles.separator} />}
                        ListEmptyComponent={
                            <View style={styles.centerList}>
                                <Text style={styles.emptyText}>{t('rates.noHistory', 'Brak danych historycznych')}</Text>
                            </View>
                        }
                        scrollEnabled={false}
                    />
                </View>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },
    backButton: {
        padding: 5,
    },
    scrollContainer: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 30,
        backgroundColor: '#F5F7FA',
    },
    centerList: {
        padding: 20,
        alignItems: 'center',
    },
    summaryCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 20,
        marginBottom: 30,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    summaryFlag: {
        fontSize: 48,
        marginBottom: 10,
    },
    summaryCode: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#5844ED',
    },
    summaryName: {
        fontSize: 18,
        color: '#667080',
        marginTop: 4,
    },
    summaryRate: {
        fontSize: 16,
        color: '#333333',
        fontWeight: '600',
        marginTop: 15,
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: '#F5F7FA',
        width: '100%',
        textAlign: 'center',
    },
    groupTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#99A2AD',
        textTransform: 'uppercase',
        marginLeft: 10,
        marginBottom: 8,
    },
    chartContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        marginBottom: 30,
        paddingTop: 50,
        paddingBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    chartPlaceholder: {
        fontSize: 16,
        color: '#99A2AD',
        fontStyle: 'italic',
        textAlign: 'center',
        padding: 20,
    },
    xAxisLabel: {
        color: '#99A2AD',
        fontSize: 12,
    },
    yAxisLabel: {
        color: '#99A2AD',
        fontSize: 11,
    },
    tooltip: {
        backgroundColor: '#333333',
        borderRadius: 6,
        paddingVertical: 8,
        paddingHorizontal: 12,
        justifyContent: 'center',
        alignItems: 'center',
        width: TOOLTIP_WIDTH,
        height: TOOLTIP_HEIGHT,

        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 10,
        zIndex: 10,
    },
    tooltipDate: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '500',
    },
    tooltipValue: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: 'bold',
        marginTop: 3,
    },
    historyGroup: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        marginBottom: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
        overflow: 'hidden',
    },
    historyItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 20,
        backgroundColor: '#FFFFFF',
    },
    historyDate: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333333',
    },
    historyMid: {
        fontSize: 16,
        fontWeight: '600',
        color: '#5844ED',
    },
    separator: {
        height: 1,
        backgroundColor: '#F5F7FA',
        marginLeft: 20,
    },
    emptyText: {
        fontSize: 16,
        color: '#99A2AD',
    },
});