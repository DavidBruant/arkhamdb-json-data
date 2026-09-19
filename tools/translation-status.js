//@ts-check

import {join} from 'node:path'
import {readFile, readdir} from 'node:fs/promises'


/** 
 * @typedef {Object} Card
 * @prop {string} code
 * @prop {string} type_code
 * @prop {string} [name]
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

const translatableProperties = /** @type {const} */ (['name', 'traits', 'text', 'flavor', 'back_name', 'back_flavor', 'back_text']);


/**
 * Tool to assess translation status for a given language
 * 
 */

const translationDir = 'translations'
const languageDir = 'fr';

// traits that are exactly the same in French as in English
const similarFrenchTranslationTraits = new Set([
    undefined,
    // core
    'Miskatonic.',
    'Miskatonic. Central.',
    'Mutation.',
    'Arkham.',
    'Arkham. Central.',
    'Talent.',
    'Talent. Science.',
    'Obstacle.', 
    
    // dwl
    'Dunwich. Central.',
    'Dunwich.',
    'Reporter.',
    'Train.',

    // ptc
    'Paris.',
    'Assistant.'
])

// name that are exactly the same in French as in English
const similarFrenchTranslationNames = new Set([
    undefined,
    // core
    'Barricade',
    'Endurance', 
    'M1911',
    'Prestidigitation',
    'French Hill',
    'Acolyte',

    // dwl
    'La Bella Luna',
    //'Peter Clover',
    'Thrall',
    'Adaptable',
    'Springfield M1903',
    
    // ptc
    'Recharge',
    'St. Barnabé', 
    'Montparnasse', 
    'Montmartre',
    'Opéra Garnier', 
    "Gare d'Orsay",
    'Canal Saint-Martin', 
    'Le Marais',
    'Notre-Dame', 
    'Suggestion',
    "Porte de l'Avancée", 
    'Chœur Gothique',
    'Lupara',
    'Fin', 
    'Possession',
    'Sophie',
    'Improvisation',
    'Poltergeist',
    'Corrosion',
    'Mano a Mano'

])

// flavor texts that are exactly the same in French as in English
const similarFrenchTranslationFlavor = new Set([
    undefined,
    'Negotium perambulans in tenebris...'
])



const packsDir = 'pack'
//const packDir = 'core'
//const packDir = 'dwl'
const packDir = 'ptc'
/**
 * This is meant to be an approximation
 * 
 * @param {Card} translationCard 
 * @param {Card} referenceCard
 */
function findMissingTranslations(translationCard, referenceCard){

    const missingTranslations = []

    for(const prop of translatableProperties){
        const referenceText = referenceCard[prop];
        const translationText = translationCard[prop];

        if(prop === 'traits'){
            if(!similarFrenchTranslationTraits.has(translationText) && translationText === referenceText){
                missingTranslations.push({
                    referenceCard,
                    translationCard,
                    property: prop
                })
            }
        }
        else{
            if(prop === 'name' || prop === 'back_name'){
                if(
                    referenceCard.type_code === 'investigator' || 
                    (referenceCard.type_code === 'asset' && (referenceCard.traits?.includes('Ally.') || referenceCard.traits?.includes('Humanoid.') || referenceCard.traits?.includes('Bystander.')) && referenceCard.is_unique) || 
                    (referenceCard.type_code === 'enemy' && referenceCard.is_unique)
                ){
                    // names of unique people/enemies aren't translated
                }
                else{
                    if(translationText === referenceText && !similarFrenchTranslationNames.has(translationText)){
                        missingTranslations.push({
                            referenceCard,
                            translationCard,
                            property: prop
                        })
                    }
                }

            }
            else{
                if(prop === 'flavor'){
                    if(translationText === referenceText && !similarFrenchTranslationFlavor.has(translationText)){
                        missingTranslations.push({
                            referenceCard,
                            translationCard,
                            property: prop
                        })
                    }
                }
                else{
                    // base case, if texts are different, they're a translation
                    if(referenceText && translationText && translationText === referenceText){
                        missingTranslations.push({
                                referenceCard,
                                translationCard,
                                property: prop
                        })
                        
                    }
                }
            }
        }
    }

    return missingTranslations
}



const referencePackFilenames = await readdir(join(import.meta.dirname, '..', packsDir, packDir))


for(const packFilename of referencePackFilenames){
    const referenceFilepath = join(import.meta.dirname, '..', packsDir, packDir, packFilename)
    const translationFilepath = join(import.meta.dirname, '..', translationDir, languageDir, packsDir, packDir, packFilename)

    const referenceFileString = await readFile(referenceFilepath, 'utf-8')
    const translationFileString = await readFile(translationFilepath, 'utf-8')

    /** @type {Card[]} */
    const referenceData = JSON.parse(referenceFileString)
    /** @type {Card[]} */
    const translationData = JSON.parse(translationFileString)

    console.info(`\nChecking missing translations for ${packsDir}/${packDir}/${packFilename}`)
    /** @type {ReturnType<findMissingTranslations>} */
    let missingTranslations = [];
    for(const referenceCard of referenceData){
        const referenceCardHasTranslatedProperties = translatableProperties.some(prop => typeof referenceCard[prop] === 'string')

        if(referenceCardHasTranslatedProperties){
            // for+find is O(n³) and maybe that's ok for the number of cards
            const translationCard = translationData.find(({code: code2}) => referenceCard.code === code2)

            if(!translationCard){
                throw new TypeError(`Missing translated card for ${referenceFilepath} code ${referenceCard.code}`)
            }

            const missingTranslationsForThisCard = findMissingTranslations(translationCard, referenceCard)

            if(missingTranslationsForThisCard.length >= 1){
                missingTranslations = [
                    ...missingTranslations, 
                    ...missingTranslationsForThisCard
                ]
            }
        }
    }

    if(missingTranslations.length === 0){
        console.log(`No missing ${languageDir} translations for ${packsDir}/${packDir}/${packFilename}`)
    }
    else{
        for(const {referenceCard, translationCard, property} of missingTranslations){
            console.log('Missing translation', packDir, packFilename, 'card', referenceCard.code, 'property', property)
            console.log('Reference:', referenceCard[property])
            console.log('Translation:',  translationCard[property])
        }
    }


    

}

