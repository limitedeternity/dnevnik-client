import anchorme from 'anchorme';

export default function linkReplace(text) {
  let escapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    '\'': '&apos;'
  };

  let escapedText = text.replace(/[&<>"']/g, (match) => escapeMap[match]);
  let replacedText = anchorme(escapedText, {
    emails: false,
    attributes: [
      {
        name: 'target',
        value: '_blank'
      },
      {
        name: 'rel',
        value: 'noopener'
      }
    ]
  });

  let parsedText = (new DOMParser()).parseFromString(replacedText, 'text/html');

  Array.from(parsedText.getElementsByTagName('a')).forEach(link => link.innerText = '[ссылка]');
  return parsedText.querySelector('body').innerHTML;
}
