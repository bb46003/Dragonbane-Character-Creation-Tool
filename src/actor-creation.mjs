import DoD_Utility from "/systems/dragonbane/modules/utility.js";

export default class CreateActor {
  constructor(user_id = "", data = {}) {
    this.user_id = user_id;
    this.data = data;
  }
  async create() {
    const name = this.data.name;
    const attributes = this.data.attributes;
    const age = this.data.age;
    const userId = this.user_id;

    const allSet = Object.values(attributes).every((value) => value !== 0);

    if (!allSet) {
      return;
    }

    const system = {
      attributes: {},
      willPoints: {
        value: 10,
        base: 10,
        max: 10,
      },
      hitPoints: {
        value: 10,
        base: 10,
        max: 10,
      },
    };

    Object.entries(attributes).forEach(([key, value]) => {
      system.attributes[key] = {
        base: value,
      };
      if (key === "con") {
        system.hitPoints.value = value;
      }
      if (key === "wil") {
        system.willPoints.value = value;
      }
    });

    const actor = await Actor.create({
      name,
      type: "character",
      system,
      ownership: {
        [userId]: 3,
      },
    });
    await actor.update({ "system.age": age });
    const kinUuid = this.data.kinUuid;
    const professionUuid = this.data.professionUuid;
    if (kinUuid !== "") {
      const kin = await fromUuid(kinUuid);
      const kinData = kin.toObject();
      await actor.createEmbeddedDocuments("Item", [kinData]);
      await actor.updateKinAbilities();
    }
    if (professionUuid !== "") {
      const profession = await fromUuid(professionUuid);
      const professionData = profession.toObject();
      await actor.createEmbeddedDocuments("Item", [professionData]);
      let missingSkills = await actor.updateProfession();
      for (const skillName of missingSkills) {
        const skill = await DoD_Utility.findSkill(skillName);
        if (skill) {
          await actor.createEmbeddedDocuments("Item", [skill.toObject()]);
        } else {
          DoD_Utility.WARNING("DoD.WARNING.professionSkill", {
            skill: skillName,
          });
        }
      }
    }
    const skills = this.data.selectedSkills;

    if (skills.length > 0) {
      const updates = actor.items
        .filter((item) => skills.includes(item.name))
        .map((item) => {
          let baseValue = item.system.value;

          if (baseValue === 0) {
            baseValue = actor._getBaseChance(item);
          }

          return item.update({
            "system.isProfessionSkill": true,
            "system.value": baseValue * 2,
          });
        });

      await Promise.all(updates);
    }
  }
}
