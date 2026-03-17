(() => {
  'use strict'

  const forms = document.querySelectorAll('.needs-validation')

  Array.from(forms).forEach(form => {
    const trimRequiredTextFields = () => {
      const requiredFields = form.querySelectorAll(
        'input[required][type="text"], input[required]:not([type]), textarea[required]'
      );

      requiredFields.forEach(field => {
        if (field.value.trim() === '') {
          field.value = '';
          field.setCustomValidity('This field is required');
        } else {
          field.value = field.value.trim();
          field.setCustomValidity('');
        }
      });
    };

    form.addEventListener('submit', event => {
      trimRequiredTextFields();

      if (!form.checkValidity()) {
        event.preventDefault()
        event.stopPropagation()
      }

      form.classList.add('was-validated')
    }, false);

    form.querySelectorAll('input[required], textarea[required]').forEach(field => {
      field.addEventListener('input', () => {
        if (field.value.trim() === '') {
          field.setCustomValidity('This field is required');
        } else {
          field.setCustomValidity('');
        }
      });
    });
  });
})();
