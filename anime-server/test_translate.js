import { translate } from 'google-translate-api-x';

(async () => {
  try {
    const inputs = ['Hello', 'World', 'How are you?'];
    // Test array support
    const res = await translate(inputs, { to: 'fr' });
    console.log('Array Result:', res);
    if (Array.isArray(res)) {
        res.forEach(r => console.log(r.text));
    } else {
        console.log('Single object returned:', res.text);
    }
  } catch (e) {
    console.error('Array Error:', e.message);
    
    // Fallback test with delimiter
    try {
        const joined = inputs.join(' ||| ');
        const res2 = await translate(joined, { to: 'fr' });
        console.log('Joined Result:', res2.text);
    } catch (e2) {
        console.error('Joined Error:', e2.message);
    }
  }
})();
