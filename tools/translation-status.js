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
const packFilename = 'core.json'
//const packFilename = 'core_2026_encounter.json'

const referenceFilepath = join(import.meta.dirname, '..', packsDir, packDir, packFilename)
const translationFilepath = join(import.meta.dirname, '..', translationDir, languageDir, packsDir, packDir, packFilename)

const referenceFileString = await readFile(referenceFilepath, 'utf-8')
const translationFileString = await readFile(translationFilepath, 'utf-8')

/** 
 * @typedef {Object} Card
 * @prop {string} code
 * @prop {string} type_code
 * @prop {string} name
 * @prop {string} [slot]
 * @prop {string} [traits]
 * @prop {string} [text]
 * @prop {string} [flavor]
 * @prop {string} [back_name]
 * @prop {string} [back_text]
 * @prop {string} [back_flavor]
 * @prop {boolean} [is_unique]
 * 
*/

/** @type {Card[]} */
const referenceData = JSON.parse(referenceFileString)
/** @type {Card[]} */
const translationData = JSON.parse(translationFileString)

const translatableProperties = /** @type {const} */ (['name', 'traits', 'text', 'flavor', 'back_name', 'back_flavor', 'back_text']);

/** @typedef {translatableProperties[keyof translatableProperties]} TranslatableProperty */

// traits that are exactly the same in French as in English
const similarFrenchTranslationTraits = new Set([
    '',
    'Miskatonic.',
    'Miskatonic. Central.',
    'Mutation.',
    'Arkham.',
    'Arkham. Central.',
    'Talent.',
    'Talent. Science.'
])

// name that are exactly the same in French as in English
const similarFrenchTranslationNames = new Set([
    'Barricade',
])



/**
 * This is meant to be an approximation
 * 
 * @param {Card} translationCard 
 * @param {Card} referenceCard
 */
function findMissingTranslations(translationCard, referenceCard){

    for(const prop of translatableProperties){
        const referenceText = referenceCard[prop];
        const translationText = translationCard[prop];

        if(prop === 'traits'){
            if(!similarFrenchTranslationTraits.has(translationText || '') && translationText === referenceText){
                // untranslated
                console.log('Missing translation', packDir, packFilename, 'card', referenceCard.code)
                console.log('Reference', prop, referenceText)
                console.log('Translation', prop, translationText)
            }
        }
        else{
            if(prop === 'name'){
                if(
                    referenceCard.type_code === 'investigator' || 
                    (referenceCard.type_code === 'asset' && referenceCard.traits?.includes('Ally') && referenceCard.is_unique)
                ){
                    // names of unique people aren't translated
                }
                else{
                    if(translationText === referenceText && !similarFrenchTranslationNames.has(translationText || '')){
                        console.log('Missing translation', packDir, packFilename, 'card', referenceCard.code)
                        console.log('Reference', prop, referenceText)
                        console.log('Translation', prop, translationText)
                    }
                }

            }
            else{
                // base case, if texts are different, they're a translation
                if(referenceText && translationText && translationText === referenceText){
                    console.log('Missing translation', packDir, packFilename, 'card', referenceCard.code)
                    console.log('Reference', prop, referenceText)
                    console.log('Translation', prop, translationText)
                }
            }
            
        }

        
    }


}


for(const referenceCard of referenceData){
    // for+find is O(n³) and maybe that's ok for the number of cards
    const translationCard = translationData.find(({code: code2}) => referenceCard.code === code2)

    if(!translationCard){
        console.error
        throw new TypeError(`Missing translated card for ${referenceFilepath} code ${referenceCard.code}`)
    }

    findMissingTranslations(translationCard, referenceCard)


}

