'use client';
import { useState } from 'react';
import { CreatePlayerInput, Player, POSITIONS, TIERS } from '@/domain/types';
import { usePlatform } from './provider';
import { MAX_RATING, TIER_RATINGS } from '@/domain/rating';
export function PlayerForm({
  player,
  onDone,
  administrative = false,
  initialName,
}: {
  player?: Player;
  onDone: (player?: Player) => void;
  administrative?: boolean;
  initialName?: { riotId: string; riotTag: string };
}) {
  const { services, run, busy } = usePlatform();
  const [input, setInput] = useState<CreatePlayerInput>(
    player ?? {
      displayName: initialName?.riotId ?? '',
      riotId: initialName?.riotId ?? '',
      riotTag: initialName?.riotTag || 'KR1',
      tier: 'GOLD',
      mainPosition: 'MID',
      subPosition: 'JUNGLE',
      internalRating: TIER_RATINGS.GOLD,
      adminAdjustment: 0,
    },
  );
  function field<K extends keyof CreatePlayerInput>(key: K, value: CreatePlayerInput[K]) {
    setInput({ ...input, [key]: value });
  }
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const result = await run(
          () =>
            administrative
              ? player
                ? services.players.update(player.id, input)
                : services.players.create(input)
              : player
                ? services.players.updateSelf(player.id, input)
                : services.players.registerSelf(input),
          player ? '선수 정보를 수정했습니다.' : '선수를 등록했습니다.',
        );
        if (result) onDone(result);
      }}
    >
      <div className="form-grid">
        <label className="full">
          선수 이름
          <input
            required
            maxLength={60}
            value={input.displayName}
            onChange={(e) => field('displayName', e.target.value)}
            placeholder="커뮤니티에서 사용할 이름"
          />
        </label>
        <label>
          Riot ID
          <input
            required
            maxLength={60}
            value={input.riotId}
            onChange={(e) => field('riotId', e.target.value)}
            placeholder="소환사 이름"
          />
        </label>
        <label>
          Riot Tag
          <input
            required
            maxLength={60}
            value={input.riotTag}
            onChange={(e) => field('riotTag', e.target.value)}
            placeholder="KR1"
          />
        </label>
        <label>
          Riot Tier
          <select
            value={input.tier}
            onChange={(e) => field('tier', e.target.value as Player['tier'])}
          >
            {TIERS.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
        {administrative && (
          <label>
            내부 레이팅
            <input
              type="number"
              required
              min="0"
              max={MAX_RATING}
              value={input.internalRating}
              onChange={(e) => field('internalRating', Number(e.target.value))}
            />
          </label>
        )}
        <label>
          주 포지션
          <select
            value={input.mainPosition}
            onChange={(e) => field('mainPosition', e.target.value as Player['mainPosition'])}
          >
            {POSITIONS.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </label>
        <label>
          부 포지션
          <select
            value={input.subPosition}
            onChange={(e) => field('subPosition', e.target.value as Player['subPosition'])}
          >
            {POSITIONS.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </label>
        {administrative && (
          <label>
            운영자 보정
            <input
              type="number"
              required
              min={-input.internalRating}
              max={MAX_RATING - input.internalRating}
              value={input.adminAdjustment}
              onChange={(e) => field('adminAdjustment', Number(e.target.value))}
            />
          </label>
        )}
        <div className="derived-value">
          <small>최종 레이팅</small>
          <strong>
            {administrative || player
              ? input.internalRating + input.adminAdjustment
              : TIER_RATINGS[input.tier]}
          </strong>
          <small>최대 {MAX_RATING.toLocaleString()}점</small>
        </div>
      </div>
      <p className="form-note">
        {administrative
          ? '내부 레이팅과 운영자 보정을 합한 최종 점수는 0~3,000점으로 제한됩니다.'
          : player
            ? '기존 레이팅은 유지됩니다. 레이팅 보정은 운영자에게 요청해 주세요.'
            : '선택한 티어의 기본 점수가 자동 적용됩니다. 레이팅을 직접 입력하거나 변경할 수 없습니다.'}
      </p>
      <div className="form-actions">
        <button type="button" onClick={() => onDone()}>
          취소
        </button>
        <button className="primary" disabled={busy}>
          {busy ? '저장 중…' : player ? '변경사항 저장' : '선수 등록'}
        </button>
      </div>
    </form>
  );
}
