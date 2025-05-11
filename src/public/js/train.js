document.getElementById('train-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData);
  formData.append('photos', data.photos);

  let id;

  const uploadResponse = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  if (uploadResponse.ok) {
    const data = await response.json();
    id = data.id;
  } else{
    console.error('Failed to train model');
    return
  }

  const trainResponse = await fetch(`/api/train`,{
    method: 'POST',
    body: JSON.stringify({ id }),
  });

  if (trainResponse.ok) {
    console.log('Training started');
  } else {
    console.error('Failed to train model');
  }
});

