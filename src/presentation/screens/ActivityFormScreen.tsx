import React, { useEffect, useState } from 'react';
import { ScrollView, Alert } from 'react-native';
import styled from 'styled-components/native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Activity, ActivityDraft } from '@domain/entities/Activity';
import { ValidationError } from '@shared/errors/AppError';
import { useActivities, useActivityMutations } from '@presentation/hooks/useActivities';
import { Screen } from '@presentation/components/Screen';
import { Display, Caption, Eyebrow } from '@presentation/components/Text';
import { PrimaryButton, PrimaryButtonLabel } from '@presentation/components/Pressable';
import { RootStackParamList } from '@presentation/navigation/types';
import { theme as appTheme } from '@presentation/theme/theme';

const Body = styled.View`
  padding: ${({ theme }) => theme.spacing(5)}px;
  gap: ${({ theme }) => theme.spacing(4)}px;
`;

const Field = styled.View`
  gap: ${({ theme }) => theme.spacing(1.5)}px;
`;

const Input = styled.TextInput.attrs({
  placeholderTextColor: appTheme.colors.textMuted,
})`
  background-color: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radius.md}px;
  border-width: 1px;
  border-color: ${({ theme }) => theme.colors.border};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: ${({ theme }) => theme.fontSize.md}px;
  padding: ${({ theme }) => theme.spacing(3.5)}px;
`;

const Pair = styled.View`
  flex-direction: row;
  gap: ${({ theme }) => theme.spacing(3)}px;
`;

const Half = styled.View`
  flex: 1;
  gap: ${({ theme }) => theme.spacing(1.5)}px;
`;

type Nav = NativeStackNavigationProp<RootStackParamList, 'ActivityForm'>;
type Rt = RouteProp<RootStackParamList, 'ActivityForm'>;

const DEFAULT_DRAFT: ActivityDraft = {
  name: '',
  emoji: '⭐',
  weights: { temperature: 3, precipitation: 4, wind: 2, uv: 1 },
  temperatureC: { idealMin: 18, idealMax: 26, hardMin: 8, hardMax: 36 },
  maxPrecipitationProbability: 40,
  maxWindKmh: 30,
  maxUvIndex: 9,
};

interface ActivityFormState {
  name: string;
  emoji: string;
  idealMin: string;
  idealMax: string;
  maxPrecipitationProbability: string;
  maxWindKmh: string;
  maxUvIndex: string;
}

const num = (v: string, fallback: number) => {
  const n = Number(v.replace(',', '.'));
  return Number.isFinite(n) ? n : fallback;
};

const toFormState = (activity?: Activity): ActivityFormState => {
  const source = activity ?? DEFAULT_DRAFT;
  return {
    name: source.name,
    emoji: source.emoji,
    idealMin: String(source.temperatureC.idealMin),
    idealMax: String(source.temperatureC.idealMax),
    maxPrecipitationProbability: String(source.maxPrecipitationProbability),
    maxWindKmh: String(source.maxWindKmh),
    maxUvIndex: String(source.maxUvIndex),
  };
};

const toDraft = (form: ActivityFormState, existing?: Activity): ActivityDraft => {
  const base = existing ?? DEFAULT_DRAFT;
  return {
    name: form.name.trim(),
    emoji: form.emoji.trim() || DEFAULT_DRAFT.emoji,
    weights: base.weights,
    temperatureC: {
      ...base.temperatureC,
      idealMin: num(form.idealMin, base.temperatureC.idealMin),
      idealMax: num(form.idealMax, base.temperatureC.idealMax),
    },
    maxPrecipitationProbability: num(
      form.maxPrecipitationProbability,
      base.maxPrecipitationProbability,
    ),
    maxWindKmh: num(form.maxWindKmh, base.maxWindKmh),
    maxUvIndex: num(form.maxUvIndex, base.maxUvIndex),
  };
};

export function ActivityFormScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Rt>();
  const editId = route.params?.activityId;

  const { data: activities } = useActivities();
  const existing = activities?.find((a) => a.id === editId);

  const [form, setForm] = useState<ActivityFormState>(() => toFormState(existing));

  useEffect(() => {
    if (editId && existing) {
      setForm(toFormState(existing));
    }
  }, [editId, existing?.id]);

  const { create, update } = useActivityMutations();
  const isSaving = create.isPending || update.isPending;
  const isCustomizingPreset = !!existing?.isPreset;

  const patch = (p: Partial<ActivityFormState>) => setForm((d) => ({ ...d, ...p }));

  const onSave = async () => {
    try {
      const draft = toDraft(form, existing);
      if (editId && !isCustomizingPreset) {
        await update.mutateAsync({ id: editId, draft });
      } else {
        await create.mutateAsync(draft);
      }
      navigation.goBack();
    } catch (e) {
      const message =
        e instanceof ValidationError ? e.message : 'Não foi possível salvar.';
      Alert.alert('Confira os dados', message);
    }
  };

  return (
    <Screen>
      <ScrollView>
        <Body>
          <Eyebrow>
            {isCustomizingPreset ? 'Personalizar' : editId ? 'Editar' : 'Criar'}
          </Eyebrow>
          <Display>
            {isCustomizingPreset
              ? 'Personalizar atividade'
              : editId
                ? 'Editar atividade'
                : 'Nova atividade'}
          </Display>

          <Field>
            <Caption>Nome</Caption>
            <Input
              value={form.name}
              onChangeText={(name) => patch({ name })}
              placeholder="Ex.: Surfe"
              accessibilityLabel="Nome da atividade"
            />
          </Field>

          <Field>
            <Caption>Emoji</Caption>
            <Input
              value={form.emoji}
              onChangeText={(emoji) => patch({ emoji })}
              maxLength={2}
              accessibilityLabel="Emoji da atividade"
            />
          </Field>

          <Pair>
            <Half>
              <Caption>Temp. ideal mín (°C)</Caption>
              <Input
                keyboardType="numeric"
                value={form.idealMin}
                onChangeText={(idealMin) => patch({ idealMin })}
                accessibilityLabel="Temperatura ideal mínima em graus Celsius"
              />
            </Half>
            <Half>
              <Caption>Temp. ideal máx (°C)</Caption>
              <Input
                keyboardType="numeric"
                value={form.idealMax}
                onChangeText={(idealMax) => patch({ idealMax })}
                accessibilityLabel="Temperatura ideal máxima em graus Celsius"
              />
            </Half>
          </Pair>

          <Pair>
            <Half>
              <Caption>Chuva máx (%)</Caption>
              <Input
                keyboardType="numeric"
                value={form.maxPrecipitationProbability}
                onChangeText={(maxPrecipitationProbability) =>
                  patch({ maxPrecipitationProbability })
                }
                accessibilityLabel="Probabilidade máxima de chuva em porcentagem"
              />
            </Half>
            <Half>
              <Caption>Vento máx (km/h)</Caption>
              <Input
                keyboardType="numeric"
                value={form.maxWindKmh}
                onChangeText={(maxWindKmh) => patch({ maxWindKmh })}
                accessibilityLabel="Vento máximo em quilômetros por hora"
              />
            </Half>
          </Pair>

          <Field>
            <Caption>UV máx confortável</Caption>
            <Input
              keyboardType="numeric"
              value={form.maxUvIndex}
              onChangeText={(maxUvIndex) => patch({ maxUvIndex })}
              accessibilityLabel="Índice UV máximo confortável"
            />
          </Field>

          <PrimaryButton
            onPress={onSave}
            disabled={isSaving}
            accessibilityRole="button"
            accessibilityLabel={
              isCustomizingPreset
                ? 'Salvar como perfil personalizado'
                : editId
                  ? 'Salvar alterações'
                  : 'Criar atividade'
            }
          >
            <PrimaryButtonLabel disabled={isSaving}>
              {isSaving
                ? 'Salvando...'
                : isCustomizingPreset
                  ? 'Salvar como perfil personalizado'
                  : editId
                  ? 'Salvar alterações'
                  : 'Criar atividade'}
            </PrimaryButtonLabel>
          </PrimaryButton>
        </Body>
      </ScrollView>
    </Screen>
  );
}
