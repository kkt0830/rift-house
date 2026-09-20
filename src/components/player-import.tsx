'use client';
import { useState } from 'react';
import { readSheet } from 'read-excel-file/browser';
import { Download, FileSpreadsheet, Upload } from 'lucide-react';
import { POSITIONS, TIERS } from '@/domain/types';
import { SelfRegistrationInput } from '@/services/platform';
import { usePlatform } from './provider';

const aliases = {
  displayName: ['선수 이름', '표시 이름', 'displayName'],
  riotId: ['Riot ID', '라이엇 ID', 'riotId'],
  riotTag: ['Riot Tag', '태그', 'riotTag'],
  tier: ['티어', 'tier'],
  mainPosition: ['주 포지션', 'mainPosition'],
  subPosition: ['부 포지션', 'subPosition'],
} as const;

const requiredHeaders = ['선수 이름', 'Riot ID', 'Riot Tag', '티어', '주 포지션', '부 포지션'];

function normalize(value: unknown) {
  return String(value ?? '').trim();
}

function columnIndex(headers: string[], names: readonly string[]) {
  return headers.findIndex((header) => names.some((name) => name.toLowerCase() === header.toLowerCase()));
}

export function PlayerImport() {
  const { services, run, busy } = usePlatform();
  const [rows, setRows] = useState<SelfRegistrationInput[]>([]);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');

  async function parse(file: File) {
    setError('');
    setRows([]);
    setFileName(file.name);
    try {
      const sheet = await readSheet(file);
      if (sheet.length < 2) throw new Error('헤더와 선수 데이터가 필요합니다.');
      const headers = sheet[0].map(normalize);
      const indexes = Object.fromEntries(
        Object.entries(aliases).map(([key, names]) => [key, columnIndex(headers, names)]),
      ) as Record<keyof typeof aliases, number>;
      const missing = Object.entries(indexes).filter(([, index]) => index < 0).map(([key]) => key);
      if (missing.length) throw new Error(`필수 열이 없습니다: ${missing.join(', ')}`);
      const parsed = sheet.slice(1).filter((row) => row.some((cell) => normalize(cell))).map((row, offset) => {
        const tier = normalize(row[indexes.tier]).toUpperCase();
        const mainPosition = normalize(row[indexes.mainPosition]).toUpperCase();
        const subPosition = normalize(row[indexes.subPosition]).toUpperCase();
        const input = {
          displayName: normalize(row[indexes.displayName]),
          riotId: normalize(row[indexes.riotId]),
          riotTag: normalize(row[indexes.riotTag]) || 'KR1',
          tier,
          mainPosition,
          subPosition,
        } as SelfRegistrationInput;
        if (!input.displayName || !input.riotId) throw new Error(`${offset + 2}행: 이름과 Riot ID가 필요합니다.`);
        if (!TIERS.includes(input.tier)) throw new Error(`${offset + 2}행: 지원하지 않는 티어입니다.`);
        if (!POSITIONS.includes(input.mainPosition) || !POSITIONS.includes(input.subPosition))
          throw new Error(`${offset + 2}행: 포지션은 TOP/JUNGLE/MID/ADC/SUPPORT 중 하나여야 합니다.`);
        if (input.mainPosition === input.subPosition) throw new Error(`${offset + 2}행: 주·부 포지션이 같습니다.`);
        return input;
      });
      if (!parsed.length) throw new Error('등록할 선수 행이 없습니다.');
      setRows(parsed);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '엑셀 파일을 읽지 못했습니다.');
    }
  }

  return (
    <section className="panel padded import-panel">
      <div className="section-heading">
        <div>
          <h2><FileSpreadsheet size={20} /> 엑셀 선수 일괄 등록</h2>
          <p className="muted">예시 파일의 첫 번째 시트에 선수 정보를 입력한 뒤 그대로 업로드하세요.</p>
        </div>
        <div className="import-actions">
          <a
            className="button"
            href="/templates/rift-house-player-import-template.xlsx"
            download="rift-house-player-import-template.xlsx"
          >
            <Download size={17} /> 예시 파일 다운로드
          </a>
          <label className="button primary">
            <Upload size={17} /> 작성한 파일 선택
            <input
              hidden
              type="file"
              accept=".xlsx"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void parse(file);
                event.target.value = '';
              }}
            />
          </label>
        </div>
      </div>
      <div className="import-guide" aria-label="엑셀 작성 방법">
        <strong>작성 방법</strong>
        <ol>
          <li><b>선수 등록</b> 시트의 첫 행과 시트 이름은 변경하지 마세요.</li>
          <li>열 순서는 <code>{requiredHeaders.join(' · ')}</code>입니다.</li>
          <li>티어는 <code>GOLD 2</code>처럼 영문과 단계를 입력하세요. 마스터 이상은 단계가 없습니다.</li>
          <li>포지션은 <code>TOP / JUNGLE / MID / ADC / SUPPORT</code> 중 하나를 입력하고, 주·부 포지션을 다르게 선택하세요.</li>
          <li>레이팅은 입력하지 않아도 티어에 맞춰 자동으로 적용됩니다.</li>
        </ol>
      </div>
      {fileName && <p><strong>{fileName}</strong> · {rows.length ? `${rows.length}명 확인됨` : '검사 중'}</p>}
      {error && <p className="form-error" role="alert">{error}</p>}
      {rows.length > 0 && (
        <>
          <div className="import-preview">
            {rows.slice(0, 5).map((player) => (
              <span key={`${player.riotId}#${player.riotTag}`}>{player.displayName} · {player.riotId}#{player.riotTag}</span>
            ))}
            {rows.length > 5 && <span>외 {rows.length - 5}명</span>}
          </div>
          <button
            className="primary"
            disabled={busy}
            onClick={async () => {
              const imported = await run(() => services.players.importMany(rows), `${rows.length}명의 선수를 등록했습니다.`);
              if (imported) {
                setRows([]);
                setFileName('');
              }
            }}
          >
            {busy ? '등록 중…' : `${rows.length}명 등록`}
          </button>
        </>
      )}
    </section>
  );
}
