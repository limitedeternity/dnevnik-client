export default function coloring(mood) {
  switch (mood) {
  case 'AllIsGood':
  case 'Good':
    return 'teal';

  case 'О':
  case 'Average':
    return '#FF5722';

  case 'AllIsBad':
  case 'Н':
  case 'Bad':
    return 'red';

  case 'П':
  case 'Б':
    return '#01579B';

  default:
    return '#212121';
  }
}
