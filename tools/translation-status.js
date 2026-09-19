//@ts-check

import {join} from 'node:path'
import {readFile} from 'node:fs/promises'


/**
 * Tool to assess translation status for a given language
 * 
 */

const translationDir = 'translations'
const languageDir = 'fr';

// get reference for a given file

const packsDir = 'pack'
const packDir = 'core'
//const packFilename = 'core.json'
const packFilename = 'core_2026_encounter.json'

const referenceFilepath = join(import.meta.dirname, '..', packsDir, packDir, packFilename)
const translationFilepath = join(import.meta.dirname, '..', translationDir, languageDir, packsDir, packDir, packFilename)

const referenceFileString = await readFile(referenceFilepath, 'utf-8')
const translationFileString = await readFile(translationFilepath, 'utf-8')

const referenceData = JSON.parse(referenceFileString)
const translationData = JSON.parse(translationFileString)

const translatableProperties = /** @type {const} */ (['name', 'traits', 'text', 'flavor', 'back_name', 'back_flavor', 'back_text']);

/** @typedef {translatableProperties[keyof translatableProperties]} TranslatableProperty */

// traits that are translated the same in French as in English
const similarFrenchTranslationTraits = new Set([
    'Miskatonic.',
    'Miskatonic. Central.',
    'Mutation.',
    'Arkham.',
    'Arkham. Central.',
    'Talent.'
])

/**
 * This is meant to be an approximation
 * 
 * @param {string} maybeTranslation 
 * @param {string} reference 
 * @param {TranslatableProperty} property 
 */
function isTextATranslationOfReference(maybeTranslation, reference, property){
    if(maybeTranslation !== reference){
         // base case, if texts are different, they're a translation
        return true
    }

    if(property === 'traits'){
        if(similarFrenchTranslationTraits.has(maybeTranslation)){
            return true
        }
        else 
            return false
    }

    return false
}

// name/text/trait

for(const referenceCard of referenceData){
    // for+find is O(n³) and maybe that's ok for the number of cards
    const translatedCard = translationData.find(({code: code2}) => referenceCard.code === code2)

    if(!translatedCard){
        console.error('Missing translated card for ', referenceFilepath, 'code', code)
    }

    for(const prop of translatableProperties){
        const referenceText = referenceCard[prop];
        const translationText = translatedCard[prop];

        if(referenceText && translationText && !isTextATranslationOfReference(translationText, referenceText, prop)){
            console.log('Missing translation', packDir, packFilename, 'card', referenceCard.code)
            console.log('Reference', prop, referenceText)
            console.log('Translation', prop, translationText)
        }
    }

 


}


