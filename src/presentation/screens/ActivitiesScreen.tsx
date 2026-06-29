import React, { useCallback } from 'react';
import { Alert, FlatList } from 'react-native';
import styled from 'styled-components/native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { Activity } from '@domain/entities/Activity';
import { useActivities, useActivityMutations } from '@presentation/hooks/useActivities';
import { Screen } from '@presentation/components/Screen';
import { Display, Title, Eyebrow, Body } from '@presentation/components/Text';
import { PrimaryButton, PrimaryButtonLabel } from '@presentation/components/Pressable';
import { FadeInView } from '@presentation/components/FadeInView';
import { ScalePressable } from '@presentation/components/ScalePressable';
import { LoadingView } from '@presentation/components/StateViews';
import { RootStackParamList } from '@presentation/navigation/types';

const TopBar = styled.View`
  padding-horizontal: ${({ theme }) => theme.spacing(5)}px;
  padding-top: ${({ theme }) => theme.spacing(2)}px;
  padding-bottom: ${({ theme }) => theme.spacing(3)}px;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`;

const BackButton = styled(ScalePressable)`
  min-width: 44px;
  min-height: 44px;
  align-items: flex-start;
  justify-content: center;
`;

const TopTitle = styled.Text`
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: ${({ theme }) => theme.fontSize.lg}px;
  font-weight: 800;
`;

const Header = styled.View`
  padding: ${({ theme }) => theme.spacing(5)}px;
  padding-top: ${({ theme }) => theme.spacing(3)}px;
  gap: ${({ theme }) => theme.spacing(4)}px;
`;

const ActivityCard = styled(ScalePressable)`
  margin-horizontal: ${({ theme }) => theme.spacing(5)}px;
  background-color: ${({ theme }) => theme.colors.nightElevated};
  border-radius: ${({ theme }) => theme.radius.md}px;
  border-width: 1px;
  border-color: rgba(181, 192, 194, 0.15);
  padding: ${({ theme }) => theme.spacing(4)}px;
  min-height: 104px;
`;

const ActivityTop = styled.View`
  flex-direction: row;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(3)}px;
`;

const EmojiBox = styled.View`
  width: 48px;
  height: 48px;
  border-radius: ${({ theme }) => theme.radius.md}px;
  background-color: ${({ theme }) => theme.colors.surface};
  align-items: center;
  justify-content: center;
`;

const Emoji = styled.Text`
  font-size: 24px;
`;

const ActivityCopy = styled.View`
  flex: 1;
  min-width: 0px;
`;

const ActivityName = styled(Title)`
  font-size: ${({ theme }) => theme.fontSize.lg}px;
`;

const ActivityStatus = styled.Text`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSize.xs}px;
  font-weight: 800;
  margin-top: ${({ theme }) => theme.spacing(0.5)}px;
  text-transform: uppercase;
`;

const Metrics = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing(2)}px;
  margin-top: ${({ theme }) => theme.spacing(4)}px;
`;

const Metric = styled.View`
  flex-direction: row;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1.5)}px;
  background-color: rgba(16, 20, 23, 0.46);
  border-radius: ${({ theme }) => theme.radius.pill}px;
  padding-vertical: ${({ theme }) => theme.spacing(1.5)}px;
  padding-horizontal: ${({ theme }) => theme.spacing(2.5)}px;
`;

const MetricText = styled.Text`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSize.xs}px;
  font-weight: 700;
`;

const Spacer = styled.View`
  height: ${({ theme }) => theme.spacing(3)}px;
`;

const Footer = styled.View`
  padding-horizontal: ${({ theme }) => theme.spacing(5)}px;
  padding-top: ${({ theme }) => theme.spacing(3)}px;
  padding-bottom: ${({ theme }) => theme.spacing(5)}px;
  background-color: ${({ theme }) => theme.colors.night};
`;

type Nav = NativeStackNavigationProp<RootStackParamList, 'Activities'>;

export function ActivitiesScreen() {
  const navigation = useNavigation<Nav>();
  const { data, isLoading } = useActivities();
  const { remove } = useActivityMutations();
  const activities = data ?? [];

  const confirmDelete = useCallback((activity: Activity) => {
    Alert.alert('Excluir atividade', `Remover "${activity.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: () => remove.mutate(activity.id) },
    ]);
  }, [remove]);

  const goToForm = useCallback(
    (activity?: Activity) => {
      navigation.navigate('ActivityForm', activity ? { activityId: activity.id } : {});
    },
    [navigation],
  );

  const renderActivity = useCallback(
    ({ item, index }: { item: Activity; index: number }) => (
      <FadeInView delay={index * 35} distance={8}>
        <ActivityCard
          onPress={() => goToForm(item)}
          onLongPress={() => (item.isPreset ? undefined : confirmDelete(item))}
          accessibilityRole="button"
          accessibilityLabel={`${item.name}. Temperatura ideal de ${item.temperatureC.idealMin} a ${item.temperatureC.idealMax} graus. Chuva até ${item.maxPrecipitationProbability} por cento. Vento até ${item.maxWindKmh} quilômetros por hora.`}
          accessibilityHint={
            item.isPreset
              ? 'Toque para ajustar este perfil.'
              : 'Toque para editar. Toque e segure para excluir.'
          }
        >
          <ActivityTop>
            <EmojiBox>
              <Emoji>{item.emoji}</Emoji>
            </EmojiBox>
            <ActivityCopy>
              <ActivityName numberOfLines={1}>{item.name}</ActivityName>
              <ActivityStatus>
                {item.isPreset ? 'Ajustável' : 'Seu perfil'}
              </ActivityStatus>
            </ActivityCopy>
            <Ionicons name="chevron-forward" size={20} color="#F5B544" />
          </ActivityTop>

          <Metrics>
            <Metric>
              <Ionicons name="thermometer-outline" size={14} color="#819092" />
              <MetricText>
                {item.temperatureC.idealMin}–{item.temperatureC.idealMax}°C
              </MetricText>
            </Metric>
            <Metric>
              <Ionicons name="rainy-outline" size={14} color="#819092" />
              <MetricText>{item.maxPrecipitationProbability}%</MetricText>
            </Metric>
            <Metric>
              <Ionicons name="flag-outline" size={14} color="#819092" />
              <MetricText>{item.maxWindKmh} km/h</MetricText>
            </Metric>
            <Metric>
              <Ionicons name="sunny-outline" size={14} color="#819092" />
              <MetricText>UV {item.maxUvIndex}</MetricText>
            </Metric>
          </Metrics>
        </ActivityCard>
      </FadeInView>
    ),
    [confirmDelete, goToForm],
  );

  if (isLoading) {
    return (
      <Screen>
        <LoadingView label="Carregando atividades…" />
      </Screen>
    );
  }

  return (
    <Screen>
      <FadeInView>
        <TopBar>
          <BackButton
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Voltar"
            hitSlop={8}
          >
            <Ionicons name="chevron-back" size={30} color="#F5B544" />
          </BackButton>
          <TopTitle>Atividades</TopTitle>
          <BackButton
            onPress={() => goToForm()}
            accessibilityRole="button"
            accessibilityLabel="Criar nova atividade"
            hitSlop={8}
          >
            <Ionicons name="add" size={30} color="#F5B544" />
          </BackButton>
        </TopBar>
      </FadeInView>

      <FlatList
        data={activities}
        keyExtractor={(a) => a.id}
        renderItem={renderActivity}
        ItemSeparatorComponent={Spacer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 16 }}
        ListHeaderComponent={
          <FadeInView delay={60}>
            <Header>
              <Eyebrow>Perfis</Eyebrow>
              <Display>Perfis de atividade</Display>
              <Body>
                Cada atividade muda a leitura do clima. Toque em qualquer perfil
                para ajustar temperatura, chuva, vento e UV ao seu jeito.
              </Body>
            </Header>
          </FadeInView>
        }
      />

      <Footer>
        <PrimaryButton
          onPress={() => goToForm()}
          accessibilityRole="button"
          accessibilityLabel="Criar nova atividade"
        >
          <PrimaryButtonLabel>Nova atividade</PrimaryButtonLabel>
        </PrimaryButton>
      </Footer>
    </Screen>
  );
}
