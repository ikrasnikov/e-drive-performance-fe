export default {
  extends: [
    'stylelint-config-standard',
    'stylelint-config-sass-guidelines',
    'stylelint-config-clean-order/error',
  ],
  rules: {
    'alpha-value-notation': ['number'],
    // CSS-only validation rules do not understand SCSS syntax (@mixin, @include with interpolation)
    'at-rule-prelude-no-invalid': null,
    'annotation-no-unknown': [
      true,
      {
        ignoreAnnotations: ['default'],
      },
    ],
    'color-function-notation': 'legacy',
    'custom-property-pattern': null,
    'declaration-block-no-redundant-longhand-properties': [
      true,
      {
        ignoreShorthands: ['/flex/', '/grid/'],
      },
    ],
    'declaration-no-important': true,
    'declaration-property-value-disallowed-list': {
      'font-weight': ['normal', 'bold'],
      '/^outline/': ['none', '0'],
    },
    'function-no-unknown': null,
    'import-notation': 'string',
    'max-nesting-depth': [
      3,
      {
        ignoreAtRules: ['each', 'media', 'supports', 'include'],
      },
    ],
    'media-feature-name-no-vendor-prefix': null,
    'number-max-precision': 10,
    'order/properties-alphabetical-order': null,
    'property-no-vendor-prefix': null,
    'selector-class-pattern': [
      '^[a-z]([a-z0-9-]+)?(__([a-z0-9]+-?)+)?(--([a-z0-9]+-?)+){0,1}$',
      {
        resolveNestedSelectors: true,
        message:
          'Selector should be written in Two Dashes BEM style (block-name__element-name--modifier-name-value)',
      },
    ],
    'selector-max-compound-selectors': 2,
    'selector-max-specificity': '0,3,0',
    'selector-nested-pattern': [
      '^(?!&-[a-z0-9])',
      {
        message: 'Nesting BEM parts via "&-" is not allowed, write the full class name instead',
      },
    ],
    'selector-no-vendor-prefix': null,
    'unit-disallowed-list': [
      ['px'],
      {
        message:
          "Avoid using 'px' units for font sizes, margins, padding, etc. as they are less accessible and not responsive.",
        ignoreProperties: { px: ['/^border/'] },
        ignoreMediaFeatureNames: { px: ['min-width', 'max-width', 'min-height', 'max-height'] },
      },
    ],
    'value-no-vendor-prefix': null,
  },
};
