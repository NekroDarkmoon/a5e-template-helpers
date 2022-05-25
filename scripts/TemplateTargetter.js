// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//                               Imports and Constants
// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
import { moduleName, moduleTag } from './constants.js';

// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//                                    Template Targeting
// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
export class TemplateTargeting {
	constructor() {
		Hooks.on('createMeasuredTemplate', this._setTargets.bind(this));
	}

	_setTargets(measuredTemplate, data, userId) {
		if (userId !== game.user?.id) return;

		if (game.user?.targets.size === 0 && measuredTemplate?.object) {
			const template = measuredTemplate.object;
			if (template.shape)
				this._getTemplateTokens({
					x: measuredTemplate.data.x,
					y: measuredTemplate.data.y,
					shape: template.shape,
					distance: template.data.distance,
				});
			else {
				const { shape, distance } =
					this._computeShapeDistance(measuredTemplate);
				this._getTemplateTokens({
					x: measuredTemplate.data.x,
					y: measuredTemplate.data.y,
					shape,
					distance,
				});
			}
		}

		const item = this?.item;
		const targeting = game.settings.get(moduleName, 'autoTarget');

		console.log(item);
		console.log(targeting);

		//  this.templateId = templateDocument?.id;
		//  this.templateUuid = templateDocument?.uuid;
		//   if (targeting === "none") { // this is no good
		//     Hooks.callAll("midi-qol-targeted", this.targets);
		//     return true;
		//   }

		//   // if the item specifies a range of "special" don't target the caster.
		//   let selfTarget = (item?.data.data.range?.units === "spec") ? getCanvas().tokens?.get(this.tokenId) : null;
		//   if (selfTarget && game.user?.targets.has(selfTarget)) {
		//     // we are targeted and should not be
		//     selfTarget.setTarget(false, { user: game.user, releaseOthers: false })
		//   }
		//   this.saves = new Set();
		//   const userTargets = game.user?.targets;
		//   this.targets = new Set(userTargets);
		//   this.hitTargets = new Set(userTargets);
		//   this.templateData = templateDocument.data;
		//   this.needTemplate = false;
		//   if (this instanceof BetterRollsWorkflow) {
		//     if (this.needItemCard) {
		//       return;
		//     } else return this.next(WORKFLOWSTATES.NONE);
		//   }
		//   if (this instanceof TrapWorkflow) return;
		//   return this.next(WORKFLOWSTATES.TEMPLATEPLACED);
		// };
	}

	/**
	 *
	 * @param {Object} templateData
	 * @param {Number} templateData.x
	 * @param {Number} templateData.y
	 * @param {*} templateData.shape
	 * @param {Number} templateData.distance
	 * @returns {Array<>} Tokens
	 */
	_getTemplateTokens(templateData) {
		const autoTarget = game.settings.get(moduleName, 'autoTarget');
		if (autoTarget === 'none') return [];
		const wallsBlocked = ['wallsBlock', 'wallsBlockIgnoreDefeated'].includes(
			autoTarget
		);

		// Get All Tokens
		const tokens = canvas?.tokens?.placeables || [];
		const targets = [];
		const targetTokens = [];
		tokens.forEach(t => {
			if (
				t.actor &&
				TemplateTargeting.isInsidePoly(templateData, t, wallsBlocked)
			) {
				const actorData = t.actor?.data;
				if (
					['wallsBlock', 'always'].includes(autoTarget) ||
					actorData?.data.attributes.hp.value > 0
				) {
					if (t.document.id) {
						targetTokens.push(t);
						targets.push(t.document.id);
					}
				}
			}
		});

		game.user?.updateTokenTargets(targets);
		game.user?.broadcastActivity(targets);
		return targetTokens;
	}

	/**
	 * @param {*} measuredTemplate
	 */
	_computeShapeDistance(measuredTemplate) {
		let { direction, distance, angle, width } = template.data;
		const dimensions = canvas?.dimensions || { size: 1, distance: 1 };
		distance *= dimensions.size / dimensions.distance;
		width *= dimensions.size / dimensions.distance;

		let shape;

		switch (measuredTemplate.data.t) {
			case 'circle':
				shape = new PIXI.Circle(0, 0, distance);
				return { shape, distance };

			case 'cone':
				shape = measuredTemplate._object._getConeShape(
					direction,
					angle,
					distance
				);
				return { shape, distance };

			case 'rect':
				shape = measuredTemplate._object._getRectShape(direction, distance);
				return { shape, distance };

			case 'ray':
				shape = measuredTemplate._object._getRayShape(
					direction,
					distance,
					width
				);
				return { shape, distance };
		}
	}

	static isInsidePoly(templateData, token, wallsBlock) {
		const grid = canvas?.scene.data.grid;
		const templatePos = { x: templateData.x, y: templateData.y };

		const startX = token.data.width >= 1 ? 0.5 : token.data.width / 2;
		const startY = token.data.height >= 1 ? 0.5 : token.data.height / 2;

		for (let x = startX; x < token.data.width; x++) {
			for (let y = startY; y < token.data.height; y++) {
				const curGrid = {
					x: token.data.x + x * grid - templatePos.x,
					y: token.data.y + y * grid - templatePos.y,
				};

				let contains = templateData.shape?.contains(curGrid.x, curGrid.y);
				if (contains && wallsBlock) {
					let tx = templatePos.x;
					let ty = templatePos.y;

					if (templateData.shape.type === 1) {
						tx = tx + templateDetails.shape.width / 2;
						ty = ty + templateDetails.shape.height / 2;
					}

					const r = new Ray(
						{ x: tx, y: ty },
						{ x: curGrid.x + templatePos.x, y: curGrid.y + templatePos.y }
					);

					contains = canvas.walls?.checkCollision(r);
				}

				if (contains) return true;
			}
		}

		return false;
	}
}
