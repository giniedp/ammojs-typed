import * as webidl2 from 'webidl2'
import * as ts from 'typescript'

export function printAmmoModule(nodes: ts.Statement[]): string {
  const file = ts.createSourceFile('ammo.d.ts', '', ts.ScriptTarget.Latest, false, ts.ScriptKind.TS)
  const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed, })

  // export default Ammo;
  const ammoAlias = ts.createExportAssignment(
    /* decorators     */[],
    /* modifiers      */[ts.createModifier(ts.SyntaxKind.DefaultKeyword)],
    /* isExportEquals */ false,
    /* expression     */ ts.createIdentifier('Ammo'),
  )

  // export function Ammo<T>(ns?: T): Promise<T & typeof Ammo>;
  const ammoExport = ts.createFunctionDeclaration(
    /* decorators     */[],
    /* modifiers      */[ts.createModifier(ts.SyntaxKind.ExportKeyword)],
    /* asteriskToken  */ undefined,
    /* name           */ 'Ammo',
    /* typeParameters */[ts.createTypeParameterDeclaration('T')],
    /* parameters     */[ts.createParameter([], [], undefined, 'api', ts.createToken(ts.SyntaxKind.QuestionToken), ts.createTypeReferenceNode('T', []))],
    /* type           */ ts.createTypeReferenceNode('Promise', [ts.createIntersectionTypeNode([ts.createTypeReferenceNode('T', []), ts.createTypeQueryNode(ts.createIdentifier('Ammo'))])]),
    /* body           */ undefined
  )

  // export declare module Ammo {
  const ammoModule = ts.createModuleDeclaration(
    /* decorators */[],
    /* modifiers  */[ts.createModifier(ts.SyntaxKind.ExportKeyword), ts.createModifier(ts.SyntaxKind.DeclareKeyword)],
    /* name       */ ts.createIdentifier('Ammo'),
    /* body       */ ts.createModuleBlock(nodes)
  )

  return [
    printer.printNode(ts.EmitHint.Unspecified, ammoAlias, file),
    printer.printNode(ts.EmitHint.Unspecified, ammoExport, file),
    printer.printNode(ts.EmitHint.Unspecified, ammoModule, file),
  ].join('\n')
}

export function printAmmoAmbient(nodes: ts.Statement[]): string {
  const file = ts.createSourceFile('ammo.d.ts', '', ts.ScriptTarget.Latest, false, ts.ScriptKind.TS)
  const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed, })

  // declare function Ammo<T>(ns?: T): Promise<T & typeof Ammo>;
  const ammoLoader = ts.createFunctionDeclaration(
    /* decorators     */[],
    /* modifiers      */[ts.createModifier(ts.SyntaxKind.DeclareKeyword)],
    /* asteriskToken  */ undefined,
    /* name           */ 'Ammo',
    /* typeParameters */[ts.createTypeParameterDeclaration('T')],
    /* parameters     */[ts.createParameter([], [], undefined, 'api', ts.createToken(ts.SyntaxKind.QuestionToken), ts.createTypeReferenceNode('T', []))],
    /* type           */ ts.createTypeReferenceNode('Promise', [ts.createIntersectionTypeNode([ts.createTypeReferenceNode('T', []), ts.createTypeQueryNode(ts.createIdentifier('Ammo'))])]),
    /* body           */ undefined
  )
  // declare module Ammo { ... }
  const ammoModule = ts.createModuleDeclaration(
    /* decorators */[],
    /* modifiers  */[ts.createModifier(ts.SyntaxKind.DeclareKeyword)],
    /* name       */ ts.createIdentifier('Ammo'),
    /* body       */ ts.createModuleBlock(nodes)
  )

  return [
    printer.printNode(ts.EmitHint.Unspecified, ammoLoader, file),
    printer.printNode(ts.EmitHint.Unspecified, ammoModule, file),
  ].join('\n')
}

export function convertIDL(rootTypes: webidl2.IDLRootType[]): ts.Statement[] {
  const nodes: ts.Statement[] = []
  for (const rootType of rootTypes) {
    if (rootType.type === 'interface') {
      nodes.push(convertInterface(rootType))
    } else if (rootType.type === 'enum') {
      nodes.push(convertEnum(rootType))
    } else {
      console.log('unknown IDL type', rootType.type)
    }
  }
  // function destroy(obj: any): void;
  const ammoDestroy = ts.createFunctionDeclaration(
    /* decorators     */[],
    /* modifiers      */[],
    /* asteriskToken  */ undefined,
    /* name           */ 'destroy',
    /* typeParameters */[],
    /* parameters     */[ts.createParameter([], [], undefined, 'obj', undefined, ts.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword))],
    /* type           */ ts.createKeywordTypeNode(ts.SyntaxKind.VoidKeyword),
    /* body           */ undefined
  )
  nodes.unshift(ammoDestroy)
  return nodes
}

function convertInterface(idl: webidl2.InterfaceType) {
  if (idl.partial) {
    throw new Error('Unsupported IDL structure')
  }

  const members: ts.TypeElement[] = []
  idl.members.forEach(member => {
    switch (member.type) {
      case 'attribute':
        members.push(createAttributeGetter(member))
        members.push(createAttributeSetter(member))
        break
      case 'operation':
        members.push(convertMemberOperation(member, idl))
        break
      default:
        console.log(idl)
        throw new Error('Unsupported IDL structure')
    }
  })

  let inheritance = []
  if (idl.inheritance) {
    inheritance.push(
      ts.createHeritageClause(ts.SyntaxKind.ExtendsKeyword, [
        ts.createExpressionWithTypeArguments(undefined, ts.createIdentifier(idl.inheritance)),
      ])
    )
  }

  return ts.createClassDeclaration([], [], idl.name, [], inheritance, members as any)
}

function createAttributeGetter(value: webidl2.AttributeMemberType) {
  return ts.createMethodSignature([], [], convertType(value.idlType), 'get_' + value.name, undefined)
}

function createAttributeSetter(value: webidl2.AttributeMemberType) {
  const parameter = ts.createParameter([], [], undefined, value.name, undefined, convertType(value.idlType))
  return ts.createMethodSignature([], [parameter], ts.createKeywordTypeNode(ts.SyntaxKind.VoidKeyword), 'set_' + value.name, undefined)
}

function convertMemberOperation(idl: webidl2.OperationMemberType, owner: webidl2.InterfaceType) {
  const args = idl.arguments.map(convertArgument)
  if (idl.name === owner.name) {
    return ts.createMethodSignature([], args, undefined, 'constructor', undefined)
  } else {
    return ts.createMethodSignature([], args, convertType(idl.idlType), idl.name, undefined)
  }
}

function convertArgument(idl: webidl2.Argument) {
  const optional = idl.optional ? ts.createToken(ts.SyntaxKind.QuestionToken) : undefined
  return ts.createParameter([], [], undefined, idl.name, optional, convertType(idl.idlType))
}

function convertType(idl: webidl2.IDLTypeDescription): ts.TypeNode {
  if (typeof idl.idlType === 'string') {
    switch (idl.idlType) {
      case 'float':
      case 'long':
      case 'double':
      case 'short':
        return ts.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword)
      case 'VoidPtr':
        return ts.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword)
      case 'string':
      case 'DOMString':
        return ts.createKeywordTypeNode(ts.SyntaxKind.StringKeyword)
      default:
        return ts.createTypeReferenceNode(idl.idlType, [])
    }
  }
  if (idl.generic === 'sequence') {
    let subtype: ts.TypeNode
    if (!Array.isArray(idl.idlType)) {
      subtype = convertType(idl.idlType)
    } else if (idl.idlType.length === 1) {
      subtype = convertType(idl.idlType[0])
    } else {
      subtype = ts.createUnionTypeNode(idl.idlType.map(convertType))
    }
    return ts.createArrayTypeNode(subtype)
  }
  if (idl.union) {
    return ts.createUnionTypeNode(idl.idlType.map(convertType))
  }
  throw new Error('Unsupported IDL type')
}

function convertEnum(idl: webidl2.EnumType) {
  const members = idl.values.map(it => ts.createEnumMember(it.value, null))
  return ts.createEnumDeclaration([], [], idl.name, members)
}
