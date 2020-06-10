/*
 * Copyright © 2018 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Project } from "@atomist/skill/lib/project/project";
import * as fs from "fs-extra";
import * as path from "path";
import * as assert from "power-assert";
import {
    addEntryToChangelog,
    ChangelogEntry,
    changelogToString,
    readChangelog,
    writeChangelog,
} from "../../lib/changelog/changelog";
import { DefaultFileName } from "../../lib/configuration";

describe("changelog", () => {

    const clPath = path.join(process.cwd(), "CHANGELOG.md");
    const buPath = clPath + ".test-backup";
    before(() => {
        fs.copyFileSync(clPath, buPath);
    });

    after(() => {
        fs.moveSync(buPath, clPath, { overwrite: true });
    });

    it("should create changelog", () => {
        const tcl = path.join("test", DefaultFileName);
        return readChangelog(tcl)
            .then(result => {
                assert(result.title === "Changelog");
                assert(result.versions.some((v: any) => v.version === "0.0.0"));
            })
            .then(() => fs.removeSync(tcl), () => fs.removeSync(tcl));
    });

    it("should read changelog", () => {
        const p = path.join(process.cwd(), DefaultFileName);
        return readChangelog(p)
            .then(result => {
                assert(result.versions.length > 0);
                assert.equal(result.title, "Changelog");
            });
    });

    it("should add entry to changelog", () => {
        const clp = path.join(process.cwd(), DefaultFileName);
        const p = {
            id: {
                owner: "atomist",
                repo: "test",
            },
        } as any as Project;
        const entry: ChangelogEntry = {
            label: "#1",
            title: "This is a test label",
            category: "added",
            url: "https://github.com/atomist/test/issues/1",
            qualifiers: [],
            authors: ["foo"],
        };
        return readChangelog(clp).then(result => {
            const cl = addEntryToChangelog(entry, result, p);
            assert.equal(cl.versions[0].parsed.Added[cl.versions[0].parsed.Added.length - 1],
                "-   This is a test label. [#1](https://github.com/atomist/test/issues/1) by [@foo](https://github.com/foo)");
        });
    });

    it("should convert back to markdown", async () => {
        const clp = path.join(process.cwd(), DefaultFileName);
        const p = {
            id: {
                owner: "atomist",
                repo: "test",
            },
        } as any as Project;
        const entry: ChangelogEntry = {
            label: "#1",
            title: "Something useful was added",
            category: "added",
            url: "https://github.com/atomist/test/issues/1",
            qualifiers: [],
        };
        const result = await readChangelog(clp);
        const cl = addEntryToChangelog(entry, result, p);
        const out = changelogToString(cl);
        // tslint:disable:max-line-length
        assert(/- {3}Something useful was added. \[#1\]\(https:\/\/github.com\/atomist\/test\/issues\/1\)/m.test(out));
        assert(/\n$/.test(out));
    });

    it("should write changes back to changelog", () => {
        const clp = path.join(process.cwd(), DefaultFileName);
        const p = {
            id: {
                owner: "atomist",
                repo: "test",
            },
        } as any as Project;
        const entry: ChangelogEntry = {
            label: "1",
            title: "This is a test label with some really long text and some more bla bla bla. And even some more and more and more.",
            category: "added",
            url: "https://github.com/atomist/test/issues/1",
            qualifiers: ["breaking"],
        };
        return readChangelog(clp).then(result => {
            const cl = addEntryToChangelog(entry, result, p);
            return writeChangelog(cl, clp);
        });
    });

});
