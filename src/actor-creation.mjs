import DoD_Utility from "/systems/dragonbane/modules/utility.js";

export default class CreateActor {
  constructor(user_id = "", data = {}) {
    this.user_id = user_id;
    this.data = data;
  }
  async create() {
    const name = this.data.name;
    let attributes = this.data.attributes;
    const age = this.data.age;
    const userId = this.user_id;
    const skills = this.data.selectedSkills;
    const gear = this.data.selectedGear;
    const kinUuid = this.data.kinUuid;
    const professionUuid = this.data.professionUuid;
    const weakness = this.data.weakness;
    const memento = this.data.memento;

    const allSet = Object.values(attributes).every((value) => value !== 0);

    if (!allSet) {
      attributes = {
        str: 10,
        con: 10,
        agl: 10,
        int: 10,
        wil: 10,
        cha: 10,
      };
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
      age: age,
    };
    const modifiers = {
      young: {
        ["system.attributes.str.value"]: 0,
        ["system.attributes.con.value"]: 1,
        ["system.attributes.agl.value"]: 1,
        ["system.attributes.int.value"]: 0,
        ["system.attributes.wil.value"]: 0,
        ["system.attributes.cha.value"]: 0,
      },
      adult: {
        ["system.attributes.str.value"]: 0,
        ["system.attributes.con.value"]: 0,
        ["system.attributes.agl.value"]: 0,
        ["system.attributes.int.value"]: 0,
        ["system.attributes.wil.value"]: 0,
        ["system.attributes.cha.value"]: 0,
      },
      old: {
        ["system.attributes.str.value"]: -2,
        ["system.attributes.con.value"]: -2,
        ["system.attributes.agl.value"]: -2,
        ["system.attributes.int.value"]: 1,
        ["system.attributes.wil.value"]: 1,
        ["system.attributes.cha.value"]: 0,
      },
    };
    const ageModifiers = modifiers[age];

    Object.entries(attributes).forEach(([key, value]) => {
      const modifierKey = `system.attributes.${key}.value`;
      const modifier = ageModifiers[modifierKey] ?? 0;

      system.attributes[key] = {
        base: value + modifier,
        value: value + modifier,
      };

      if (key === "con") {
        system.hitPoints.value = value + modifier;
      }

      if (key === "wil") {
        system.willPoints.value = value + modifier;
      }
    });
    const actor = await Actor.create({
      name,
      type: "character",
      system: system,
      ownership: {
        [userId]: 3,
      },
    });

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

    if (gear !== "") {
      const entries = [];

      const itemRegex = /(?:(\d+)\s*)?@UUID\[([^\]]+)\]\{([^}]+)\}/g;

      for (const match of gear.matchAll(itemRegex)) {
        entries.push({
          type: "item",
          uuid: match[2],
          name: match[3],
          quantity: Number(match[1] ?? 1),
        });
      }
      const currencyTypes = {
        gc: [game.i18n.localize("DCCT.currency.gold").toLowerCase(), "gold"],
        sc: [
          game.i18n.localize("DCCT.currency.silver").toLowerCase(),
          "silver",
        ],
        cc: [
          game.i18n.localize("DCCT.currency.copper").toLowerCase(),
          "copper",
        ],
      };

      const currencyNames = Object.values(currencyTypes)
        .flat()
        .map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
      const currencyRegex = new RegExp(
        `(\\d+)(?:\\{[^}]*\\})?\\s+(${currencyNames.join("|")})`,
        "gi",
      );
      for (const match of gear.matchAll(currencyRegex)) {
        const quantity = Number(match[1]);
        const currencyName = match[2].toLowerCase();
        const currencyType = Object.entries(currencyTypes).find(([, names]) =>
          names.includes(currencyName),
        )?.[0];
        if (!currencyType) continue;
        entries.push({
          type: "currency",
          currency: currencyType,
          quantity,
        });
      }
      let wornWeapons = 0;
      let wornArmor = 0;
      let wornHelmet = 0;
      for (const entry of entries.filter((entry) => entry.type === "item")) {
        const item = await fromUuid(entry.uuid);

        if (!item) continue;

        const data = item.toObject();

        data.system.quantity = entry.quantity;

        if (item.system?.worn !== undefined) {
          if (item.type === "weapon") {
            if (wornWeapons < 3) {
              data.system.worn = true;
              wornWeapons++;
            } else {
              data.system.worn = false;
            }
          } else if (item.type === "armor") {
            if (wornArmor < 1) {
              data.system.worn = true;
              wornArmor++;
            } else {
              data.system.worn = false;
            }
          } else if (item.type === "helmet") {
            if (wornHelmet < 1) {
              data.system.worn = true;
              wornHelmet++;
            } else {
              data.system.worn = false;
            }
          }
        }

        await actor.createEmbeddedDocuments("Item", [data]);
      }
      const currencyUpdates = {};
      for (const entry of entries.filter(
        (entry) => entry.type === "currency",
      )) {
        currencyUpdates[entry.currency] =
          (currencyUpdates[entry.currency] ?? 0) + entry.quantity;
      }
      const actorUpdates = {};
      for (const [currency, quantity] of Object.entries(currencyUpdates)) {
        const path = `system.currency.${currency}`;
        const current = foundry.utils.getProperty(actor, path) ?? 0;
        actorUpdates[path] = current + quantity;
      }
      if (Object.keys(actorUpdates).length > 0) {
        await actor.update(actorUpdates);
      }
    }

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

    if (memento !== "") {
      const mementoItem = await fromUuid(memento);
      const data = mementoItem.toObject();
      await actor.createEmbeddedDocuments("Item", [data]);
    }

    if (weakness !== "") {
      await actor.update({ "system.weaknes": weakness });
    }
    game.modules.get("dragonbane-character-creation-tool").socketHandler.emit({
      type: "actorCreated",
      userId: userId,
      name: this.data.name,
    });
  }
}
