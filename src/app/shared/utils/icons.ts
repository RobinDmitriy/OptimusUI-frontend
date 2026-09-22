import {
  faArrowLeft,
  faArrowRight,
  faArrowsLeftRight,
  faArrowsLeftRightToLine,
  faCheckToSlot,
  faCircleQuestion,
  faEquals,
  faFlagCheckered,
  faGreaterThan,
  faGreaterThanEqual,
  faJetFighter,
  faLessThan,
  faLessThanEqual,
  faNotEqual,
  faPerson,
  faPlaneCircleExclamation,
  faQuestion,
  faSearch,
  faSeedling,
  faUsers,
} from '@fortawesome/free-solid-svg-icons';
import { IconDefinition } from '@fortawesome/angular-fontawesome';

export const FA_ICONS: { [key: string]: IconDefinition } = {
  'fa-users': faUsers,
  'fa-person': faPerson,
  'fa-jet-fighter': faJetFighter,
  'fa-seedling': faSeedling,
  'fa-plane-circle-exclamation': faPlaneCircleExclamation,
  'fa-flag-checkered': faFlagCheckered,
  'fa-circle-question': faCircleQuestion,
  'fa-question': faQuestion,
  equals: faEquals,
  'not-equals': faNotEqual,
  less: faLessThan,
  'less-than-equal': faLessThanEqual,
  greater: faGreaterThan,
  'greater-than-equal': faGreaterThanEqual,
  between: faArrowsLeftRightToLine,
  search: faSearch,
  'arrow-right': faArrowRight,
  'arrow-left': faArrowLeft,
  'left-right': faArrowsLeftRight,
  'check-to-slot': faCheckToSlot,
};

/**
 * Получение объекта иконки по названию
 * @param icon - название иконки
 */
export function getIcon(icon: string) {
  return !!FA_ICONS[icon] ? FA_ICONS[icon] : undefined;
}
