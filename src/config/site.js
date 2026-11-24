const SITE_URL = (
  process.env.REACT_APP_SITE_URL ||
  window.location.origin
).replace(/\/+$/, '');

const SITE_NAME = 'Nutri Gap';

const SITE_SLOGAN = 'Plan & Fill The Nutrition Gap';

const SITE_DESCRIPTION =
  'Discover smart meal suggestions for breakfast, lunch and dinner. Make better meal choices and work towards balanced daily nutrition with Nutri Gap.';

const SITE_LOGO = `${SITE_URL}/nutri-gap-logo.png`;

const SITE_SOCIAL_IMAGE = `${SITE_URL}/nutri-gap-social.png`;

export {
  SITE_URL,
  SITE_NAME,
  SITE_SLOGAN,
  SITE_DESCRIPTION,
  SITE_LOGO,
  SITE_SOCIAL_IMAGE
};