import { describe, expect, it } from 'vitest'
import { buildHomepageDefinitionField } from '../homepage-admin'

describe('homepage metaobject definitions', () => {
  it('restricts metaobject references to the intended definition ID', () => {
    const definitionIds = new Map([
      ['homepage_destination_group', 'gid://shopify/MetaobjectDefinition/123'],
    ])

    expect(buildHomepageDefinitionField(
      ['group', 'Destination group', 'metaobject_reference', 'homepage_destination_group'],
      definitionIds,
    )).toEqual({
      key: 'group',
      name: 'Destination group',
      type: 'metaobject_reference',
      validations: [{
        name: 'metaobject_definition_id',
        value: 'gid://shopify/MetaobjectDefinition/123',
      }],
    })
  })

  it('fails before calling Shopify when a reference target definition is unavailable', () => {
    expect(() => buildHomepageDefinitionField(
      ['group', 'Destination group', 'metaobject_reference', 'homepage_destination_group'],
      new Map(),
    )).toThrow('missing its target metaobject definition')
  })

  it('limits hotline metaobject fields to 18 characters', () => {
    expect(buildHomepageDefinitionField(
      ['hotline_line_1', 'Hotline line 1', 'single_line_text_field'],
      new Map(),
    )).toEqual({
      key: 'hotline_line_1',
      name: 'Hotline line 1',
      type: 'single_line_text_field',
      validations: [{ name: 'max', value: '18' }],
    })
  })
})
