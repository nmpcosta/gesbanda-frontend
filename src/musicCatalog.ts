
import { t } from './language';
import type { GroupMemberSummary } from './types';

type Choice = readonly [string, string];
export type MusicChoiceGroup = { title: Choice; options: readonly Choice[] };

export const instrumentGroups: readonly MusicChoiceGroup[] = [
  { title: ['Madeiras', 'Woodwind'], options: [
    ['Flautim', 'Piccolo'], ['Flauta transversal', 'Flute'], ['Flauta de bisel', 'Recorder'],
    ['Oboé', 'Oboe'], ['Corne inglês', 'Cor anglais'], ['Clarinete em Si♭', 'B-flat clarinet'], ['Clarinete em Mi♭', 'E-flat clarinet'],
    ['Clarinete alto', 'Alto clarinet'], ['Clarinete baixo', 'Bass clarinet'], ['Fagote', 'Bassoon'], ['Contrafagote', 'Contrabassoon'],
  ] },
  { title: ['Saxofones', 'Saxophones'], options: [
    ['Saxofone soprano', 'Soprano saxophone'], ['Saxofone alto', 'Alto saxophone'], ['Saxofone tenor', 'Tenor saxophone'],
    ['Saxofone barítono', 'Baritone saxophone'], ['Saxofone baixo', 'Bass saxophone'],
  ] },
  { title: ['Metais', 'Brass'], options: [
    ['Trompete', 'Trumpet'], ['Trompete piccolo', 'Piccolo trumpet'], ['Cornetim', 'Cornet'], ['Fliscorne', 'Flugelhorn'],
    ['Trompa', 'French horn'], ['Trombone tenor', 'Tenor trombone'], ['Trombone baixo', 'Bass trombone'],
    ['Bombardino', 'Euphonium'], ['Barítono', 'Baritone horn'], ['Tuba', 'Tuba'], ['Sousafone', 'Sousaphone'],
  ] },
  { title: ['Cordas', 'Strings'], options: [
    ['Violino', 'Violin'], ['Viola de arco', 'Viola'], ['Violoncelo', 'Cello'], ['Contrabaixo', 'Double bass'], ['Harpa', 'Harp'],
    ['Bandolim', 'Mandolin'], ['Cavaquinho', 'Cavaquinho'], ['Guitarra portuguesa', 'Portuguese guitar'],
  ] },
  { title: ['Guitarras, baixo e teclas', 'Guitars, bass and keys'], options: [
    ['Guitarra elétrica', 'Electric guitar'], ['Guitarra acústica', 'Acoustic guitar'], ['Guitarra clássica', 'Classical guitar'],
    ['Baixo elétrico', 'Bass guitar'], ['Piano', 'Piano'], ['Piano elétrico', 'Electric piano'], ['Teclado', 'Keyboard'],
    ['Sintetizador', 'Synthesiser'], ['Órgão', 'Organ'], ['Acordeão', 'Accordion'], ['Celesta', 'Celesta'], ['Harmónica', 'Harmonica'],
  ] },
  { title: ['Percussão', 'Percussion'], options: [
    ['Percussão', 'Percussion'], ['Bateria', 'Drum kit'], ['Tímpanos', 'Timpani'], ['Caixa', 'Snare drum'],
    ['Bombo', 'Bass drum'], ['Pratos', 'Cymbals'], ['Triângulo', 'Triangle'], ['Pandeireta', 'Tambourine'],
    ['Glockenspiel', 'Glockenspiel'], ['Xilofone', 'Xylophone'], ['Marimba', 'Marimba'], ['Vibrafone', 'Vibraphone'],
    ['Carrilhão tubular', 'Tubular bells'], ['Cajón', 'Cajón'], ['Congas', 'Congas'], ['Bongós', 'Bongos'], ['Timbales', 'Timbales'],
  ] },
  { title: ['Vozes', 'Voices'], options: [
    ['Voz principal', 'Lead vocals'], ['Segunda voz', 'Backing vocals'], ['Soprano', 'Soprano'], ['Mezzo-soprano', 'Mezzo-soprano'],
    ['Contralto', 'Alto'], ['Contratenor', 'Countertenor'], ['Tenor', 'Tenor'], ['Barítono vocal', 'Baritone'], ['Baixo vocal', 'Bass'],
  ] },
];

export const sectionGroups: readonly MusicChoiceGroup[] = [
  { title: ['Filarmónica e banda de sopros', 'Concert and wind band'], options: [
    ['Madeiras', 'Woodwind'], ['Flautas', 'Flutes'], ['Oboés', 'Oboes'], ['Clarinetes', 'Clarinets'],
    ['Fagotes', 'Bassoons'], ['Saxofones', 'Saxophones'], ['Metais', 'Brass'], ['Trompetes e cornetins', 'Trumpets and cornets'],
    ['Trompas', 'Horns'], ['Trombones', 'Trombones'], ['Bombardinos', 'Euphoniums'], ['Tubas', 'Tubas'], ['Percussão', 'Percussion'],
  ] },
  { title: ['Orquestra sinfónica', 'Symphony orchestra'], options: [
    ['Cordas', 'Strings'], ['Primeiros violinos', 'First violins'], ['Segundos violinos', 'Second violins'],
    ['Violas de arco', 'Violas'], ['Violoncelos', 'Cellos'], ['Contrabaixos', 'Double basses'], ['Harpa', 'Harp'], ['Teclas', 'Keyboards'],
  ] },
  { title: ['Orquestra ligeira, jazz e big band', 'Light orchestra, jazz and big band'], options: [
    ['Secção rítmica', 'Rhythm section'], ['Saxofones e dobragens', 'Saxophones and doubles'], ['Guitarras', 'Guitars'],
    ['Baixo', 'Bass'], ['Bateria', 'Drums'], ['Percussão latina', 'Latin percussion'],
  ] },
  { title: ['Rock, pop e coros', 'Rock, pop and choirs'], options: [
    ['Voz principal', 'Lead vocals'], ['Vozes de apoio', 'Backing vocals'], ['Guitarra solo', 'Lead guitar'],
    ['Guitarra ritmo', 'Rhythm guitar'], ['Sopranos', 'Sopranos'], ['Contraltos', 'Altos'],
    ['Tenores', 'Tenors'], ['Barítonos', 'Baritones'], ['Baixos', 'Basses'],
  ] },
];

const labels = new Map([...instrumentGroups, ...sectionGroups].flatMap((group) => group.options.map(([pt, en]) => [pt, en] as const)));

export function musicLabel(value: string): string {
  return t(value, labels.get(value) ?? value);
}

export function normalizeMusicChoice(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
}

export function memberSections(member: Pick<GroupMemberSummary, 'sections' | 'section'>): string[] {
  return member.sections ?? (member.section ? [member.section] : []);
}

export function memberInstruments(member: Pick<GroupMemberSummary, 'instruments' | 'instrument'>): string[] {
  return member.instruments ?? (member.instrument ? [member.instrument] : []);
}
